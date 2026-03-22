import { useGameStore, type Quest } from '../../store/gameStore';

const QUICK_SLOTS = ['1', '2', '3', '4', '5', '6'];

function getXPForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export function HUD() {
  const { player, enemies, quests, worldWidth, worldHeight, score } = useGameStore();
  
  const hpPercent = (player.stats.hp / player.stats.maxHp) * 100;
  const xpPercent = (player.stats.xp / getXPForLevel(player.stats.level)) * 100;
  const activeQuests = quests.filter((q: Quest) => !q.completed);

  const playerMinimapX = (player.x / worldWidth) * 120;
  const playerMinimapY = (player.y / worldHeight) * 120;

  return (
    <div className="pixel-ui" style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
      <div style={{ 
        position: 'absolute', 
        top: '16px', 
        left: '16px',
        pointerEvents: 'auto'
      }}>
        <div className="pixel-container" style={{ padding: '16px', minWidth: '250px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div>
              <div className="pixel-label" style={{ marginBottom: '4px' }}>LEVEL {player.stats.level}</div>
              <div style={{ fontSize: '14px', color: 'var(--pixel-gold)' }}>SCORE: {score}</div>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span className="pixel-label">HP</span>
              <span className="pixel-value">{player.stats.hp}/{player.stats.maxHp}</span>
            </div>
            <div className="pixel-bar-container">
              <div 
                className="pixel-bar pixel-health-bar" 
                style={{ width: `${hpPercent}%` }}
              />
              <span className="pixel-bar-text">{Math.round(hpPercent)}%</span>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span className="pixel-label">XP</span>
              <span className="pixel-value">{player.stats.xp}/{getXPForLevel(player.stats.level)}</span>
            </div>
            <div className="pixel-bar-container">
              <div 
                className="pixel-bar pixel-xp-bar" 
                style={{ width: `${xpPercent}%` }}
              />
              <span className="pixel-bar-text">{Math.round(xpPercent)}%</span>
            </div>
          </div>

          <div className="pixel-divider" style={{ margin: '12px 0' }} />

          <div style={{ display: 'flex', gap: '16px', fontSize: '8px' }}>
            <div>
              <span className="pixel-label">ATK: </span>
              <span className="pixel-value">{player.stats.atk}</span>
            </div>
            <div>
              <span className="pixel-label">DEF: </span>
              <span className="pixel-value">{player.stats.def}</span>
            </div>
          </div>

          {activeQuests.length > 0 && (
            <>
              <div className="pixel-divider" style={{ margin: '12px 0' }} />
              <div style={{ fontSize: '8px' }}>
                <span className="pixel-label">QUEST: </span>
                <span className="pixel-value">{activeQuests[0]?.title}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ 
        position: 'absolute', 
        top: '16px', 
        right: '16px',
        pointerEvents: 'auto'
      }}>
        <div className="minimap">
          <div 
            className="minimap-player"
            style={{
              left: `${playerMinimapX}px`,
              top: `${playerMinimapY}px`,
              transform: 'translate(-50%, -50%)'
            }}
          />
          {enemies.slice(0, 20).map((enemy) => (
            <div
              key={enemy.id}
              className="minimap-enemy"
              style={{
                left: `${(enemy.x / worldWidth) * 120}px`,
                top: `${(enemy.y / worldHeight) * 120}px`,
                transform: 'translate(-50%, -50%)'
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ 
        position: 'absolute', 
        bottom: '16px', 
        left: '16px',
        pointerEvents: 'auto'
      }}>
        <div className="pixel-container" style={{ padding: '12px' }}>
          <div style={{ fontSize: '8px', marginBottom: '8px', textAlign: 'center' }}>QUICK SLOTS</div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {QUICK_SLOTS.map((slot, index) => (
              <div 
                key={slot}
                className="slot"
                style={{ width: '40px', height: '40px' }}
                title={`Slot ${slot}`}
              >
                <span style={{ fontSize: '8px', opacity: 0.5 }}>{index + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ 
        position: 'absolute', 
        bottom: '16px', 
        right: '16px',
        pointerEvents: 'auto'
      }}>
        <div className="pixel-container" style={{ padding: '12px' }}>
          <div style={{ fontSize: '8px', marginBottom: '8px' }}>
            <span style={{ marginRight: '8px' }}>[I] Inventory</span>
            <span>[Q] Quests</span>
          </div>
          <div style={{ fontSize: '8px', color: 'var(--pixel-text-dim)' }}>
            [ESC] Pause
          </div>
        </div>
      </div>
    </div>
  );
}
