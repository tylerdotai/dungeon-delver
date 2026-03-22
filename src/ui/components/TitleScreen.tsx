import { useGameStore } from '../../store/gameStore';

interface SaveData {
  player: {
    x: number;
    y: number;
    width: number;
    height: number;
    stats: {
      hp: number;
      maxHp: number;
      atk: number;
      def: number;
      xp: number;
      level: number;
    };
  };
  enemies: Array<{
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
  }>;
  items: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'health' | 'weapon' | 'armor' | 'xp';
    value: number;
    name: string;
  }>;
  quests: Array<{
    id: string;
    title: string;
    description: string;
    completed: boolean;
    requiredKills?: number;
    currentKills?: number;
  }>;
  score: number;
  worldWidth: number;
  worldHeight: number;
  savedAt: number;
}

interface TitleScreenProps {
  onStart: () => void;
}

export function TitleScreen({ onStart }: TitleScreenProps) {
  const { setGameState } = useGameStore();

  const handleNewGame = () => {
    useGameStore.getState().resetGame();
    setGameState('playing');
    onStart();
  };

  const handleContinue = () => {
    const saved = loadGame();
    if (saved) {
      setGameState('playing');
      onStart();
    }
  };

  const hasSave = () => {
    return localStorage.getItem('dungeon-delver-save') !== null;
  };

  return (
    <div className="pixel-ui">
      <div className="pixel-screen-overlay">
        <div className="pixel-container" style={{ textAlign: 'center', minWidth: '400px' }}>
          <h1 className="pixel-title">DUNGEON<br/>DELVER</h1>
          
          <div style={{ marginBottom: '32px' }}>
            <div style={{ 
              fontSize: '10px', 
              color: 'var(--pixel-text-dim)',
              marginBottom: '8px',
              letterSpacing: '2px'
            }}>
              A roguelike adventure
            </div>
          </div>

          <div className="pixel-column" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button className="pixel-button" onClick={handleNewGame}>
              NEW GAME
            </button>
            
            {hasSave() && (
              <button className="pixel-button secondary" onClick={handleContinue}>
                CONTINUE
              </button>
            )}
          </div>

          <div className="pixel-divider" style={{ margin: '24px 0' }} />

          <div style={{ fontSize: '8px', color: 'var(--pixel-text-dim)' }}>
            <div>CONTROLS</div>
            <div style={{ marginTop: '8px' }}>
              ARROWS / WASD - Move<br/>
              SPACE - Attack<br/>
              I - Inventory<br/>
              Q - Quests<br/>
              ESC - Pause
            </div>
          </div>

          <div style={{ 
            marginTop: '24px', 
            fontSize: '8px', 
            color: 'var(--pixel-text-dim)',
            opacity: 0.6
          }}>
            v1.0.0
          </div>
        </div>
      </div>
    </div>
  );
}

function loadGame(): boolean {
  try {
    const saveDataStr = localStorage.getItem('dungeon-delver-save');
    if (!saveDataStr) return false;
    
    const saveData: SaveData = JSON.parse(saveDataStr);
    const store = useGameStore.getState();
    
    store.setGameState('playing');
    store.updatePlayerPosition(saveData.player.x, saveData.player.y);
    store.updatePlayerStats(saveData.player.stats);
    
    saveData.enemies.forEach((enemy) => {
      store.addEnemy(enemy);
    });
    
    saveData.items.forEach((item) => {
      store.addItem(item);
    });
    
    saveData.quests.forEach((quest) => {
      store.updateQuest(quest.id, quest);
    });
    
    store.addScore(saveData.score - store.score);
    
    return true;
  } catch {
    return false;
  }
}
