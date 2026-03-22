import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import { createRenderer, createInputManager, createGameLoop, type Renderer, type InputManager, type GameLoop } from '../../game/engine';
import { aabbOverlap } from '../../game/engine/collision';

const TILE_SIZE = 32;
const MAP_COLS = 20;
const MAP_ROWS = 15;

const TILE_COLORS: Record<string, string> = {
  floor: '#2d2d44',
  wall: '#4a4a6a',
  door: '#8b4513',
};

const ENEMY_COLORS: Record<string, string> = {
  goblin: '#4CAF50',
  orc: '#8BC34A',
  skeleton: '#E0E0E0',
  dragon: '#F44336',
};

interface GameCanvasProps {
  onAttack?: () => void;
}

export function GameCanvas({ onAttack }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const inputRef = useRef<InputManager | null>(null);
  const gameLoopRef = useRef<GameLoop | null>(null);
  const playerRef = useRef({ x: 0, y: 0 });
  const cameraRef = useRef({ x: 0, y: 0 });

  const { 
    player, 
    worldWidth, 
    worldHeight, 
    gameState,
  } = useGameStore();

  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    rendererRef.current = createRenderer(ctx, canvas.width, canvas.height);
    inputRef.current = createInputManager(canvas);
    inputRef.current.attach();
    gameLoopRef.current = createGameLoop();
    gameLoopRef.current.start();
  }, []);

  const spawnInitialEnemies = useCallback(() => {
    const store = useGameStore.getState();
    if (store.enemies.length === 0) {
      const enemyTypes = ['goblin', 'orc', 'skeleton'];
      for (let i = 0; i < 5; i++) {
        store.addEnemy({
          id: `enemy-${Date.now()}-${i}`,
          x: 200 + Math.random() * (worldWidth - 400),
          y: 200 + Math.random() * (worldHeight - 400),
          width: 32,
          height: 32,
          hp: 30 + Math.random() * 20,
          maxHp: 50,
          atk: 5 + Math.random() * 5,
          def: 2,
          xpReward: 20,
          type: enemyTypes[Math.floor(Math.random() * enemyTypes.length)],
        });
      }
    }
  }, [worldWidth, worldHeight]);

  const spawnInitialItems = useCallback(() => {
    const store = useGameStore.getState();
    if (store.items.length === 0) {
      const itemTypes: Array<{ type: 'health' | 'xp' | 'weapon' | 'armor'; value: number; name: string }> = [
        { type: 'health', value: 30, name: 'Health Potion' },
        { type: 'xp', value: 50, name: 'XP Crystal' },
        { type: 'weapon', value: 3, name: 'Iron Sword' },
        { type: 'armor', value: 2, name: 'Leather Armor' },
      ];
      for (let i = 0; i < 8; i++) {
        const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
        store.addItem({
          id: `item-${Date.now()}-${i}`,
          x: 100 + Math.random() * (worldWidth - 200),
          y: 100 + Math.random() * (worldHeight - 200),
          width: 16,
          height: 16,
          ...itemType,
        });
      }
    }
  }, [worldWidth, worldHeight]);

  const updateGame = useCallback(() => {
    if (gameState !== 'playing') return;

    const input = inputRef.current;
    const store = useGameStore.getState();
    
    if (!input) return;

    const moveVec = input.getMovementVector();
    const speed = 3;
    let newX = playerRef.current.x + moveVec.x * speed;
    let newY = playerRef.current.y + moveVec.y * speed;

    const margin = TILE_SIZE;
    newX = Math.max(margin, Math.min(newX, worldWidth - player.width - margin));
    newY = Math.max(margin, Math.min(newY, worldHeight - player.height - margin));

    if (newX !== playerRef.current.x || newY !== playerRef.current.y) {
      store.updatePlayerPosition(newX, newY);
      playerRef.current = { x: newX, y: newY };
    }

    const playerBox = { x: newX, y: newY, width: player.width, height: player.height };
    
    for (const enemy of store.enemies) {
      if (aabbOverlap(playerBox, { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height })) {
        store.damagePlayer(10);
      }
    }

    for (const item of store.items) {
      if (aabbOverlap(playerBox, { x: item.x, y: item.y, width: item.width, height: item.height })) {
        store.pickupItem(item.id);
      }
    }
  }, [gameState, worldWidth, worldHeight, player.width, player.height]);

  const renderGame = useCallback(() => {
    const renderer = rendererRef.current;
    const canvas = canvasRef.current;
    const store = useGameStore.getState();
    
    if (!renderer || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderer.clear();

    const playerX = store.player.x;
    const playerY = store.player.y;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    cameraRef.current = {
      x: Math.max(0, Math.min(playerX - canvasWidth / 2, worldWidth - canvasWidth)),
      y: Math.max(0, Math.min(playerY - canvasHeight / 2, worldHeight - canvasHeight)),
    };
    renderer.setCamera(cameraRef.current.x, cameraRef.current.y);

    ctx.fillStyle = TILE_COLORS.floor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const startCol = Math.floor(cameraRef.current.x / TILE_SIZE);
    const endCol = startCol + Math.ceil(canvasWidth / TILE_SIZE) + 1;
    const startRow = Math.floor(cameraRef.current.y / TILE_SIZE);
    const endRow = startRow + Math.ceil(canvasHeight / TILE_SIZE) + 1;

    for (let row = startRow; row < endRow && row < MAP_ROWS; row++) {
      for (let col = startCol; col < endCol && col < MAP_COLS; col++) {
        if (col < 0 || row < 0) continue;
        
        const isBorder = col === 0 || col === MAP_COLS - 1 || row === 0 || row === MAP_ROWS - 1;
        const tileX = col * TILE_SIZE;
        const tileY = row * TILE_SIZE;
        
        if (isBorder) {
          ctx.fillStyle = TILE_COLORS.wall;
          ctx.fillRect(tileX - cameraRef.current.x, tileY - cameraRef.current.y, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    for (const item of store.items) {
      const screenX = item.x - cameraRef.current.x;
      const screenY = item.y - cameraRef.current.y;
      
      if (screenX > -item.width && screenX < canvasWidth && screenY > -item.height && screenY < canvasHeight) {
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(screenX, screenY, item.width, item.height);
        
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX, screenY, item.width, item.height);
      }
    }

    for (const enemy of store.enemies) {
      const screenX = enemy.x - cameraRef.current.x;
      const screenY = enemy.y - cameraRef.current.y;
      
      if (screenX > -enemy.width && screenX < canvasWidth && screenY > -enemy.height && screenY < canvasHeight) {
        ctx.fillStyle = ENEMY_COLORS[enemy.type as keyof typeof ENEMY_COLORS] || '#FF0000';
        ctx.fillRect(screenX, screenY, enemy.width, enemy.height);
        
        ctx.fillStyle = '#FF0000';
        const hpBarWidth = enemy.width;
        const hpPercent = enemy.hp / enemy.maxHp;
        ctx.fillRect(screenX, screenY - 6, hpBarWidth * hpPercent, 4);
      }
    }

    const pScreenX = store.player.x - cameraRef.current.x;
    const pScreenY = store.player.y - cameraRef.current.y;
    ctx.fillStyle = '#3498db';
    ctx.fillRect(pScreenX, pScreenY, store.player.width, store.player.height);
    
    ctx.fillStyle = '#FFF';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(pScreenX, pScreenY, store.player.width, store.player.height);

  }, [worldWidth, worldHeight]);

  useEffect(() => {
    initGame();

    const currentGameLoop = gameLoopRef.current;
    const updateHandle = currentGameLoop?.onUpdate(() => {
      updateGame();
    });

    const renderInterval = setInterval(renderGame, 1000 / 60);

    return () => {
      clearInterval(renderInterval);
      updateHandle?.();
      currentGameLoop?.stop();
      inputRef.current?.detach();
    };
  }, [initGame, updateGame, renderGame]);

  useEffect(() => {
    playerRef.current = { x: player.x, y: player.y };
    if (gameState === 'playing') {
      spawnInitialEnemies();
      spawnInitialItems();
    }
  }, [gameState, player.x, player.y, spawnInitialEnemies, spawnInitialItems]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && onAttack) {
        e.preventDefault();
        onAttack();
        
        const store = useGameStore.getState();
        const attackRange = 48;
        const attackBox = {
          x: playerRef.current.x - attackRange / 2,
          y: playerRef.current.y - attackRange / 2,
          width: player.width + attackRange,
          height: player.height + attackRange,
        };
        
        for (const enemy of store.enemies) {
          if (aabbOverlap(attackBox, { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height })) {
            store.damageEnemy(enemy.id, store.player.stats.atk);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onAttack, player.width, player.height]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={480}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        imageRendering: 'pixelated',
      }}
    />
  );
}
