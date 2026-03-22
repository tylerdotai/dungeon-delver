import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';

interface MobileControlsProps {
  onAttack?: () => void;
}

interface DPadDirection {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export function MobileControls({ 
  onAttack, 
  onInventory, 
  onQuests, 
  onPause 
}: MobileControlsProps & { 
  onInventory?: () => void;
  onQuests?: () => void;
  onPause?: () => void;
}) {
  const { gameState } = useGameStore();
  const [directions, setDirections] = useState<DPadDirection>({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          setDirections(d => ({ ...d, up: true }));
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          setDirections(d => ({ ...d, down: true }));
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          setDirections(d => ({ ...d, left: true }));
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          setDirections(d => ({ ...d, right: true }));
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          setDirections(d => ({ ...d, up: false }));
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          setDirections(d => ({ ...d, down: false }));
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          setDirections(d => ({ ...d, left: false }));
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          setDirections(d => ({ ...d, right: false }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    let interval: number | null = null;
    
    const updatePosition = () => {
      const store = useGameStore.getState();
      if (store.gameState !== 'playing') return;

      const speed = 3;
      let dx = 0;
      let dy = 0;
      
      if (directions.up) dy -= speed;
      if (directions.down) dy += speed;
      if (directions.left) dx -= speed;
      if (directions.right) dx += speed;

      if (dx !== 0 || dy !== 0) {
        const newX = store.player.x + dx;
        const newY = store.player.y + dy;
        store.updatePlayerPosition(newX, newY);
      }
    };

    if (directions.up || directions.down || directions.left || directions.right) {
      interval = window.setInterval(updatePosition, 16);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [directions]);

  if (gameState !== 'playing') return null;

  const buttonStyle: React.CSSProperties = {
    width: '56px',
    height: '56px',
    background: 'var(--pixel-bg-light)',
    border: '3px solid var(--pixel-border)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--pixel-text)',
    fontSize: '20px',
    userSelect: 'none',
    touchAction: 'manipulation',
    cursor: 'pointer',
  };

  const activeButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'var(--pixel-accent)',
    borderColor: 'var(--pixel-accent)',
  };

  const actionButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    fontSize: '10px',
    width: '64px',
    height: '48px',
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          zIndex: 50,
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '56px 56px 56px', gap: '4px' }}>
          <div />
          <button
            style={directions.up ? activeButtonStyle : buttonStyle}
            onTouchStart={() => setDirections(d => ({ ...d, up: true }))}
            onTouchEnd={() => setDirections(d => ({ ...d, up: false }))}
            onMouseDown={() => setDirections(d => ({ ...d, up: true }))}
            onMouseUp={() => setDirections(d => ({ ...d, up: false }))}
            onMouseLeave={() => setDirections(d => ({ ...d, up: false }))}
          >
            ▲
          </button>
          <div />
          <button
            style={directions.left ? activeButtonStyle : buttonStyle}
            onTouchStart={() => setDirections(d => ({ ...d, left: true }))}
            onTouchEnd={() => setDirections(d => ({ ...d, left: false }))}
            onMouseDown={() => setDirections(d => ({ ...d, left: true }))}
            onMouseUp={() => setDirections(d => ({ ...d, left: false }))}
            onMouseLeave={() => setDirections(d => ({ ...d, left: false }))}
          >
            ◀
          </button>
          <button
            style={directions.down ? activeButtonStyle : buttonStyle}
            onTouchStart={() => setDirections(d => ({ ...d, down: true }))}
            onTouchEnd={() => setDirections(d => ({ ...d, down: false }))}
            onMouseDown={() => setDirections(d => ({ ...d, down: true }))}
            onMouseUp={() => setDirections(d => ({ ...d, down: false }))}
            onMouseLeave={() => setDirections(d => ({ ...d, down: false }))}
          >
            ▼
          </button>
          <button
            style={directions.right ? activeButtonStyle : buttonStyle}
            onTouchStart={() => setDirections(d => ({ ...d, right: true }))}
            onTouchEnd={() => setDirections(d => ({ ...d, right: false }))}
            onMouseDown={() => setDirections(d => ({ ...d, right: true }))}
            onMouseUp={() => setDirections(d => ({ ...d, right: false }))}
            onMouseLeave={() => setDirections(d => ({ ...d, right: false }))}
          >
            ▶
          </button>
        </div>

        <button
          style={{
            ...buttonStyle,
            marginTop: '16px',
            width: '100%',
            background: 'var(--pixel-health)',
            borderColor: 'var(--pixel-health)',
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            onAttack?.();
          }}
          onClick={() => onAttack?.()}
        >
          ATK
        </button>
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 50,
        }}
      >
        <button
          style={actionButtonStyle}
          onTouchStart={(e) => {
            e.preventDefault();
            onInventory?.();
          }}
          onClick={onInventory}
        >
          [I]
        </button>
        <button
          style={actionButtonStyle}
          onTouchStart={(e) => {
            e.preventDefault();
            onQuests?.();
          }}
          onClick={onQuests}
        >
          [Q]
        </button>
        <button
          style={actionButtonStyle}
          onTouchStart={(e) => {
            e.preventDefault();
            onPause?.();
          }}
          onClick={onPause}
        >
          [ESC]
        </button>
      </div>
    </>
  );
}
