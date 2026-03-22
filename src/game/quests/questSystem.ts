import questsData from '../../data/quests.json';
import type { QuestData, QuestObjective, QuestProgress } from '../../types';

export interface QuestState {
  questId: string;
  status: 'available' | 'active' | 'completed';
  objectives: QuestObjective[];
  startedAt?: number;
  completedAt?: number;
}

export interface QuestSystemState {
  quests: Map<string, QuestState>;
  activeQuestId: string | null;
}

export interface QuestReward {
  xp: number;
  gold?: number;
  items?: string[];
  waypoint?: string;
}

class QuestSystem {
  private questData: Map<string, QuestData> = new Map();
  private questStates: Map<string, QuestState> = new Map();
  private activeQuestId: string | null = null;
  private onQuestUpdate: ((quest: QuestState) => void) | null = null;

  constructor() {
    this.loadQuestData();
  }

  private loadQuestData(): void {
    const quests = (questsData as { quests: QuestData[] }).quests;
    for (const quest of quests) {
      this.questData.set(quest.id, quest);
    }
  }

  setQuestUpdateCallback(callback: (quest: QuestState) => void): void {
    this.onQuestUpdate = callback;
  }

  getAvailableQuests(npcId: string): QuestData[] {
    const available: QuestData[] = [];
    
    for (const [id, data] of this.questData) {
      const state = this.questStates.get(id);
      
      if (data.npcGiver === npcId) {
        if (!state) {
          const prereqsMet = this.checkPrerequisites(data.prerequisites || []);
          if (prereqsMet) {
            available.push(data);
          }
        }
      }
    }
    
    return available;
  }

  private checkPrerequisites(prerequisites: string[]): boolean {
    if (prerequisites.length === 0) return true;
    
    for (const prereqId of prerequisites) {
      const prereqState = this.questStates.get(prereqId);
      if (!prereqState || prereqState.status !== 'completed') {
        return false;
      }
    }
    return true;
  }

  acceptQuest(questId: string): QuestState | null {
    const questData = this.questData.get(questId);
    if (!questData) return null;
    
    const existingState = this.questStates.get(questId);
    if (existingState && existingState.status !== 'available') return null;
    
    const objectives: QuestObjective[] = questData.objectives.map(obj => ({
      ...obj,
      current: 0,
      completed: false,
    }));
    
    const questState: QuestState = {
      questId,
      status: 'active',
      objectives,
      startedAt: Date.now(),
    };
    
    this.questStates.set(questId, questState);
    this.activeQuestId = questId;
    
    if (this.onQuestUpdate) {
      this.onQuestUpdate(questState);
    }
    
    return questState;
  }

  updateObjective(questId: string, objectiveId: string, progress: number): boolean {
    const questState = this.questStates.get(questId);
    if (!questState || questState.status !== 'active') return false;
    
    const objective = questState.objectives.find(o => o.id === objectiveId);
    if (!objective) return false;
    
    objective.current = Math.min(progress, objective.required);
    
    if (objective.current >= objective.required) {
      objective.completed = true;
    }
    
    if (this.onQuestUpdate) {
      this.onQuestUpdate(questState);
    }
    
    return true;
  }

  trackKill(enemyType: string): void {
    for (const [questId, questState] of this.questStates) {
      if (questState.status !== 'active') continue;
      
      for (const objective of questState.objectives) {
        if (objective.type === 'kill' && objective.target === enemyType) {
          this.updateObjective(questId, objective.id, objective.current + 1);
        }
      }
    }
  }

  trackItemCollection(itemId: string): void {
    for (const [questId, questState] of this.questStates) {
      if (questState.status !== 'active') continue;
      
      for (const objective of questState.objectives) {
        if (objective.type === 'collect' && objective.target === itemId) {
          this.updateObjective(questId, objective.id, objective.current + 1);
        }
      }
    }
  }

  trackExploration(targetId: string): void {
    for (const [questId, questState] of this.questStates) {
      if (questState.status !== 'active') continue;
      
      for (const objective of questState.objectives) {
        if (objective.type === 'explore' && objective.target === targetId) {
          this.updateObjective(questId, objective.id, 1);
        }
      }
    }
  }

  trackInteraction(targetId: string): void {
    for (const [questId, questState] of this.questStates) {
      if (questState.status !== 'active') continue;
      
      for (const objective of questState.objectives) {
        if (objective.type === 'interact' && objective.target === targetId) {
          this.updateObjective(questId, objective.id, 1);
        }
      }
    }
  }

  checkQuestCompletion(questId: string): QuestReward | null {
    const questState = this.questStates.get(questId);
    if (!questState || questState.status !== 'active') return null;
    
    const allComplete = questState.objectives.every(o => o.completed);
    if (!allComplete) return null;
    
    const questData = this.questData.get(questId);
    if (!questData) return null;
    
    questState.status = 'completed';
    questState.completedAt = Date.now();
    
    if (this.activeQuestId === questId) {
      this.activeQuestId = null;
    }
    
    if (this.onQuestUpdate) {
      this.onQuestUpdate(questState);
    }
    
    return questData.rewards;
  }

  completeQuest(questId: string): QuestReward | null {
    return this.checkQuestCompletion(questId);
  }

  getQuestState(questId: string): QuestState | undefined {
    return this.questStates.get(questId);
  }

  getQuestData(questId: string): QuestData | undefined {
    return this.questData.get(questId);
  }

  getActiveQuest(): QuestState | null {
    if (!this.activeQuestId) return null;
    return this.questStates.get(this.activeQuestId) || null;
  }

  getActiveQuestData(): QuestData | null {
    if (!this.activeQuestId) return null;
    return this.questData.get(this.activeQuestId) || null;
  }

  getAllQuestStates(): QuestState[] {
    return Array.from(this.questStates.values());
  }

  getAllQuestData(): QuestData[] {
    return Array.from(this.questData.values());
  }

  setActiveQuest(questId: string): void {
    const questState = this.questStates.get(questId);
    if (questState && questState.status === 'active') {
      this.activeQuestId = questId;
    }
  }

  talkToNPC(npcId: string): { questUpdated: QuestState | null; newQuests: QuestData[] } {
    let questUpdated: QuestState | null = null;
    const newQuests = this.getAvailableQuests(npcId);
    
    for (const [questId, state] of this.questStates) {
      if (state.status === 'active') {
        const data = this.questData.get(questId);
        if (data && data.npcGiver === npcId) {
          for (const obj of state.objectives) {
            if (obj.type === 'talk' && obj.target === npcId) {
              this.updateObjective(questId, obj.id, 1);
              questUpdated = this.questStates.get(questId) || null;
            }
          }
        }
      }
    }
    
    return { questUpdated, newQuests };
  }

  reset(): void {
    this.questStates.clear();
    this.activeQuestId = null;
  }

  loadQuestProgress(questProgress: QuestProgress[]): void {
    for (const qp of questProgress) {
      const data = this.questData.get(qp.questId);
      if (data) {
        this.questStates.set(qp.questId, {
          questId: qp.questId,
          status: qp.status,
          objectives: qp.objectives,
        });
        
        if (qp.status === 'active') {
          this.activeQuestId = qp.questId;
        }
      }
    }
  }

  getQuestProgress(): QuestProgress[] {
    const progress: QuestProgress[] = [];
    
    for (const [questId, state] of this.questStates) {
      progress.push({
        questId,
        status: state.status,
        objectives: state.objectives,
      });
    }
    
    return progress;
  }
}

export const questSystem = new QuestSystem();
export default questSystem;