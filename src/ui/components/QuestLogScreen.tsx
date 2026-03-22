import { useGameStore, type Quest } from '../../store/gameStore';

interface QuestLogScreenProps {
  onClose: () => void;
}

export function QuestLogScreen({ onClose }: QuestLogScreenProps) {
  const { quests } = useGameStore();
  
  const activeQuests = quests.filter((q: Quest) => !q.completed);
  const completedQuests = quests.filter((q: Quest) => q.completed);

  return (
    <div className="pixel-ui">
      <div className="pixel-screen-overlay" onClick={onClose}>
        <div className="pixel-modal" onClick={e => e.stopPropagation()} style={{ padding: '24px', minWidth: '400px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 className="pixel-title" style={{ fontSize: '16px', margin: 0 }}>QUEST LOG</h2>
            <button className="pixel-button secondary" onClick={onClose} style={{ padding: '8px 12px', fontSize: '10px' }}>
              CLOSE [ESC]
            </button>
          </div>

          {quests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', fontSize: '10px', color: 'var(--pixel-text-dim)' }}>
              <div>No quests yet.</div>
              <div style={{ marginTop: '8px' }}>Explore the dungeon to find quests!</div>
            </div>
          ) : (
            <>
              {activeQuests.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '10px', marginBottom: '12px', color: 'var(--pixel-accent)' }}>
                    ACTIVE QUESTS ({activeQuests.length})
                  </div>
                  {activeQuests.map((quest: Quest) => (
                    <div key={quest.id} className="quest-item active">
                      <div style={{ fontSize: '10px', marginBottom: '8px' }}>{quest.title}</div>
                      <div style={{ fontSize: '8px', color: 'var(--pixel-text-dim)', marginBottom: '8px' }}>
                        {quest.description}
                      </div>
                      {quest.requiredKills !== undefined && (
                        <div style={{ fontSize: '8px' }}>
                          <span className="pixel-label">Progress: </span>
                          <span className="pixel-value">
                            {quest.currentKills || 0}/{quest.requiredKills} kills
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {completedQuests.length > 0 && (
                <div>
                  <div style={{ fontSize: '10px', marginBottom: '12px', color: 'var(--pixel-xp)' }}>
                    COMPLETED ({completedQuests.length})
                  </div>
                  {completedQuests.map((quest: Quest) => (
                    <div key={quest.id} className="quest-item completed">
                      <div style={{ fontSize: '10px', marginBottom: '4px', textDecoration: 'line-through' }}>
                        {quest.title}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="pixel-divider" style={{ margin: '16px 0' }} />

          <div style={{ fontSize: '8px', color: 'var(--pixel-text-dim)' }}>
            <div>Press Q or ESC to close</div>
          </div>
        </div>
      </div>
    </div>
  );
}
