import { useGameStore } from '../../store/gameStore';

interface PauseMenuProps {
  onResume: () => void;
  onMainMenu: () => void;
}

export function PauseMenu({ onResume, onMainMenu }: PauseMenuProps) {
  const { player, score, resetGame } = useGameStore();

  const handleSave = () => {
    const gameState = useGameStore.getState();
    const saveData = {
      player: gameState.player,
      enemies: gameState.enemies,
      items: gameState.items,
      quests: gameState.quests,
      score: gameState.score,
      worldWidth: gameState.worldWidth,
      worldHeight: gameState.worldHeight,
      savedAt: Date.now(),
    };
    localStorage.setItem('dungeon-delver-save', JSON.stringify(saveData));
    alert('Game saved!');
  };

  const handleNewGame = () => {
    resetGame();
    onMainMenu();
  };

  return (
    <div className="pixel-ui">
      <div className="pixel-screen-overlay">
        <div className="pixel-container" style={{ textAlign: 'center', minWidth: '300px' }}>
          <h2 className="pixel-title" style={{ fontSize: '20px', marginBottom: '32px' }}>
            PAUSED
          </h2>

          <div className="pixel-column" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button className="pixel-button" onClick={onResume}>
              RESUME
            </button>
            
            <button className="pixel-button secondary" onClick={handleSave}>
              SAVE GAME
            </button>

            <button className="pixel-button secondary" onClick={handleNewGame}>
              NEW GAME
            </button>

            <button className="pixel-button danger" onClick={onMainMenu}>
              MAIN MENU
            </button>
          </div>

          <div className="pixel-divider" style={{ margin: '24px 0' }} />

          <div style={{ fontSize: '8px', color: 'var(--pixel-text-dim)' }}>
            <div style={{ marginBottom: '8px' }}>
              <span className="pixel-label">Level: </span>
              <span className="pixel-value">{player.stats.level}</span>
            </div>
            <div>
              <span className="pixel-label">Score: </span>
              <span className="pixel-value gold">{score}</span>
            </div>
          </div>

          <div className="keybind-hint" style={{ marginTop: '16px' }}>
            Press ESC to resume
          </div>
        </div>
      </div>
    </div>
  );
}
