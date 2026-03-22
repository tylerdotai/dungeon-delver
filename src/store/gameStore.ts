import { create } from 'zustand';
import { type PlayerStats } from '../game/entities/Player';

export interface Position {
  x: number;
  y: number;
}

export interface Enemy {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  xpReward: number;
  type: string;
}

export interface Item {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'health' | 'weapon' | 'armor' | 'xp';
  value: number;
  name: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  requiredKills?: number;
  currentKills?: number;
}

export type GameState = 'menu' | 'character-select' | 'playing' | 'paused' | 'gameover';

interface GameStore {
  gameState: GameState;
  player: {
    x: number;
    y: number;
    width: number;
    height: number;
    stats: PlayerStats;
  };
  enemies: Enemy[];
  items: Item[];
  quests: Quest[];
  worldWidth: number;
  worldHeight: number;
  score: number;

  setGameState: (state: GameState) => void;
  updatePlayerPosition: (x: number, y: number) => void;
  updatePlayerStats: (stats: Partial<PlayerStats>) => void;
  addXP: (amount: number) => void;
  damagePlayer: (amount: number) => void;
  healPlayer: (amount: number) => void;
  addEnemy: (enemy: Enemy) => void;
  removeEnemy: (id: string) => void;
  updateEnemy: (id: string, updates: Partial<Enemy>) => void;
  damageEnemy: (id: string, amount: number) => void;
  addItem: (item: Item) => void;
  removeItem: (id: string) => void;
  pickupItem: (itemId: string) => void;
  updateQuest: (questId: string, updates: Partial<Quest>) => void;
  completeQuest: (questId: string) => void;
  addScore: (amount: number) => void;
  resetGame: () => void;
}

const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 2000;

const initialPlayer = {
  x: WORLD_WIDTH / 2,
  y: WORLD_HEIGHT / 2,
  width: 32,
  height: 32,
  stats: {
    hp: 100,
    maxHp: 100,
    atk: 10,
    def: 5,
    xp: 0,
    level: 1,
  },
};

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: 'menu',
  player: initialPlayer,
  enemies: [],
  items: [],
  quests: [],
  worldWidth: WORLD_WIDTH,
  worldHeight: WORLD_HEIGHT,
  score: 0,

  setGameState: (state) => set({ gameState: state }),

  updatePlayerPosition: (x, y) =>
    set((s) => ({
      player: { ...s.player, x: Math.max(0, Math.min(x, s.worldWidth - s.player.width)), y: Math.max(0, Math.min(y, s.worldHeight - s.player.height)) },
    })),

  updatePlayerStats: (stats) =>
    set((s) => ({
      player: { ...s.player, stats: { ...s.player.stats, ...stats } },
    })),

  addXP: (amount) =>
    set((s) => {
      const newXP = s.player.stats.xp + amount;
      let newLevel = s.player.stats.level;
      let newMaxHp = s.player.stats.maxHp;
      let newAtk = s.player.stats.atk;
      let newDef = s.player.stats.def;

      let xpRemaining = newXP;
      while (xpRemaining >= getXPForLevel(newLevel)) {
        xpRemaining -= getXPForLevel(newLevel);
        newLevel++;
        newMaxHp += 10;
        newAtk += 2;
        newDef += 1;
      }

      return {
        player: {
          ...s.player,
          stats: {
            ...s.player.stats,
            xp: xpRemaining,
            level: newLevel,
            maxHp: newMaxHp,
            hp: newLevel > s.player.stats.level ? newMaxHp : s.player.stats.hp,
            atk: newAtk,
            def: newDef,
          },
        },
      };
    }),

  damagePlayer: (amount) =>
    set((s) => {
      const actualDamage = Math.max(1, amount - s.player.stats.def);
      const newHp = Math.max(0, s.player.stats.hp - actualDamage);
      return {
        player: { ...s.player, stats: { ...s.player.stats, hp: newHp } },
        gameState: newHp <= 0 ? 'gameover' : s.gameState,
      };
    }),

  healPlayer: (amount) =>
    set((s) => ({
      player: {
        ...s.player,
        stats: {
          ...s.player.stats,
          hp: Math.min(s.player.stats.maxHp, s.player.stats.hp + amount),
        },
      },
    })),

  addEnemy: (enemy) =>
    set((s) => ({ enemies: [...s.enemies, enemy] })),

  removeEnemy: (id) =>
    set((s) => ({ enemies: s.enemies.filter((e) => e.id !== id) })),

  updateEnemy: (id, updates) =>
    set((s) => ({
      enemies: s.enemies.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })),

  damageEnemy: (id, amount) =>
    set((s) => {
      const enemy = s.enemies.find((e) => e.id === id);
      if (!enemy) return s;
      const actualDamage = Math.max(1, amount - enemy.def);
      const newHp = enemy.hp - actualDamage;
      if (newHp <= 0) {
        return {
          enemies: s.enemies.filter((e) => e.id !== id),
          score: s.score + (enemy.xpReward || 10),
        };
      }
      return {
        enemies: s.enemies.map((e) => (e.id === id ? { ...e, hp: newHp } : e)),
      };
    }),

  addItem: (item) =>
    set((s) => ({ items: [...s.items, item] })),

  removeItem: (id) =>
    set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

  pickupItem: (itemId) => {
    const s = get();
    const item = s.items.find((i) => i.id === itemId);
    if (!item) return;

    switch (item.type) {
      case 'health':
        s.healPlayer(item.value);
        break;
      case 'xp':
        s.addXP(item.value);
        break;
      case 'weapon':
        s.updatePlayerStats({ atk: s.player.stats.atk + item.value });
        break;
      case 'armor':
        s.updatePlayerStats({ def: s.player.stats.def + item.value });
        break;
    }

    s.removeItem(itemId);
  },

  updateQuest: (questId, updates) =>
    set((s) => ({
      quests: s.quests.map((q) => (q.id === questId ? { ...q, ...updates } : q)),
    })),

  completeQuest: (questId) =>
    set((s) => ({
      quests: s.quests.map((q) => (q.id === questId ? { ...q, completed: true } : q)),
    })),

  addScore: (amount) =>
    set((s) => ({ score: s.score + amount })),

  resetGame: () =>
    set({
      gameState: 'playing',
      player: initialPlayer,
      enemies: [],
      items: [],
      quests: [],
      score: 0,
    }),
}));

function getXPForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}
