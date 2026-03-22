import { useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import {
  TitleScreen,
  CharacterSelect,
  HUD,
  InventoryScreen,
  QuestLogScreen,
  PauseMenu,
} from './index';
import type { CharacterClass } from '../types';

import '../ui/styles/pixel-ui.css';

export function Game() {
  const { gameState, setGameState } = useGameStore();
  const [showInventory, setShowInventory] = useState(false);
  const [showQuests, setShowQuests] = useState(false);
  const [showPause, setShowPause] = useState(false);

  const handleStartGame = useCallback(() => {
    setGameState('character-select');
  }, [setGameState]);

  const handleCharacterSelect = useCallback((characterClass: CharacterClass): void => {
    const store = useGameStore.getState();
    store.resetGame();
    
    switch (characterClass) {
      case 'knight':
        store.updatePlayerStats({ maxHp: 120, atk: 12, def: 8 });
        break;
      case 'rogue':
        store.updatePlayerStats({ maxHp: 80, atk: 15, def: 4 });
        break;
      case 'mage':
        store.updatePlayerStats({ maxHp: 70, atk: 18, def: 3 });
        break;
    }
    
    store.healPlayer(store.player.stats.maxHp);
    setGameState('playing');
    setShowInventory(false);
    setShowQuests(false);
    setShowPause(false);
  }, [setGameState]);

  const handleOpenInventory = useCallback(() => {
    if (gameState === 'playing') {
      setShowInventory(true);
    }
  }, [gameState]);

  const handleCloseInventory = useCallback(() => {
    setShowInventory(false);
  }, []);

  const handleOpenQuests = useCallback(() => {
    if (gameState === 'playing') {
      setShowQuests(true);
    }
  }, [gameState]);

  const handleCloseQuests = useCallback(() => {
    setShowQuests(false);
  }, []);

  const handleTogglePause = useCallback(() => {
    if (gameState === 'playing') {
      setShowPause(true);
      setGameState('paused');
    } else if (gameState === 'paused') {
      setShowPause(false);
      setGameState('playing');
    }
  }, [gameState, setGameState]);

  const handleResume = useCallback(() => {
    setShowPause(false);
    setGameState('playing');
  }, [setGameState]);

  const handleMainMenu = useCallback(() => {
    setShowPause(false);
    setShowInventory(false);
    setShowQuests(false);
    setGameState('menu');
  }, [setGameState]);

  useKeyboardShortcuts({
    onInventory: handleOpenInventory,
    onQuests: handleOpenQuests,
    onPause: handleTogglePause,
    onStart: handleStartGame,
    enabled: gameState === 'playing' || gameState === 'paused',
  });

  return (
    <div className="pixel-ui" style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {gameState === 'menu' && (
        <TitleScreen onStart={handleStartGame} />
      )}

      {gameState === 'character-select' && (
        <CharacterSelect 
          onSelect={handleCharacterSelect} 
          onBack={() => setGameState('menu')} 
        />
      )}

      {gameState === 'playing' && (
        <>
          <HUD />
          {showInventory && (
            <InventoryScreen onClose={handleCloseInventory} />
          )}
          {showQuests && (
            <QuestLogScreen onClose={handleCloseQuests} />
          )}
        </>
      )}

      {gameState === 'paused' && showPause && (
        <PauseMenu 
          onResume={handleResume} 
          onMainMenu={handleMainMenu} 
        />
      )}

      {gameState === 'gameover' && (
        <div className="pixel-screen-overlay">
          <div className="pixel-container" style={{ textAlign: 'center' }}>
            <h2 className="pixel-title" style={{ fontSize: '24px', color: 'var(--pixel-health)' }}>
              GAME OVER
            </h2>
            <div style={{ marginBottom: '24px', fontSize: '10px' }}>
              Final Score: {useGameStore.getState().score}
            </div>
            <button className="pixel-button" onClick={handleMainMenu}>
              MAIN MENU
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
