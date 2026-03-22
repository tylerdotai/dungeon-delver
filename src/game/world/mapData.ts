import tilesData from '../../data/tiles.json';

export const TILE_SIZE = 32;
export const MAP_WIDTH = 2000;
export const MAP_HEIGHT = 2000;
export const CHUNK_SIZE = 64;

export type BiomeType = 'forest' | 'cave' | 'ruins' | 'boss';

export interface TileDefinition {
  id: number;
  name: string;
  biome: BiomeType;
  color: string;
  walkable: boolean;
  solid: boolean;
  damage: number;
  description: string;
}

export interface BiomeConfig {
  name: string;
  primaryTile: number;
  wallTile: number;
  dangerLevel: number;
  spawnEnemies: string[];
}

export interface TileMap {
  width: number;
  height: number;
  tiles: Uint16Array;
  biomes: Map<BiomeType, { x: number; y: number; width: number; height: number }>;
}

export interface Waypoint {
  id: string;
  x: number;
  y: number;
  biome: BiomeType;
  unlocked: boolean;
  name: string;
}

export const TILE_DEFINITIONS: TileDefinition[] = tilesData.tiles as TileDefinition[];
export const BIOME_CONFIGS: Record<BiomeType, BiomeConfig> = tilesData.biomes as Record<BiomeType, BiomeConfig>;

export const getTileById = (id: number): TileDefinition | undefined => {
  return TILE_DEFINITIONS.find(t => t.id === id);
};

export const getTileByName = (name: string): TileDefinition | undefined => {
  return TILE_DEFINITIONS.find(t => t.name === name);
};

export const isTileSolid = (tileId: number): boolean => {
  const tile = getTileById(tileId);
  return tile?.solid ?? false;
};

export const isTileWalkable = (tileId: number): boolean => {
  const tile = getTileById(tileId);
  return tile?.walkable ?? false;
};

export const getTileDamage = (tileId: number): number => {
  const tile = getTileById(tileId);
  return tile?.damage ?? 0;
};

const seededRandom = (seed: number): () => number => {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
};

const noise2D = (x: number, y: number, scale: number, random: () => number): number => {
  const nx = x / scale;
  const ny = y / scale;
  const n0 = Math.floor(nx);
  const n1 = Math.floor(ny);
  const fx = nx - n0;
  const fy = ny - n1;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  
  const smooth = (a: number, b: number, t: number): number => {
    return a + t * (b - a);
  };
  
  const v00 = random();
  const v10 = random();
  const v01 = random();
  const v11 = random();
  
  return smooth(
    smooth(v00, v10, sx),
    smooth(v01, v11, sx),
    sy
  );
};

const generateBiomeMap = (): Map<BiomeType, { x: number; y: number; width: number; height: number }> => {
  const biomes = new Map<BiomeType, { x: number; y: number; width: number; height: number }>();
  
  const forest: { x: number; y: number; width: number; height: number } = {
    x: 0,
    y: 0,
    width: MAP_WIDTH * 0.5,
    height: MAP_HEIGHT * 0.5,
  };
  biomes.set('forest', forest);
  
  const cave: { x: number; y: number; width: number; height: number } = {
    x: MAP_WIDTH * 0.5,
    y: 0,
    width: MAP_WIDTH * 0.5,
    height: MAP_HEIGHT * 0.5,
  };
  biomes.set('cave', cave);
  
  const ruins: { x: number; y: number; width: number; height: number } = {
    x: 0,
    y: MAP_HEIGHT * 0.5,
    width: MAP_WIDTH * 0.5,
    height: MAP_HEIGHT * 0.5,
  };
  biomes.set('ruins', ruins);
  
  const boss: { x: number; y: number; width: number; height: number } = {
    x: MAP_WIDTH * 0.5,
    y: MAP_HEIGHT * 0.5,
    width: MAP_WIDTH * 0.5,
    height: MAP_HEIGHT * 0.5,
  };
  biomes.set('boss', boss);
  
  return biomes;
};

const getBiomeAt = (
  x: number,
  y: number,
  biomeRegions: Map<BiomeType, { x: number; y: number; width: number; height: number }>
): BiomeType => {
  for (const [biome, region] of biomeRegions) {
    if (x >= region.x && x < region.x + region.width &&
        y >= region.y && y < region.y + region.height) {
      return biome;
    }
  }
  return 'forest';
};

export const generateProceduralMap = (seed: number = Date.now()): TileMap => {
  const random = seededRandom(seed);
  const tiles = new Uint16Array(MAP_WIDTH * MAP_HEIGHT);
  const biomeRegions = generateBiomeMap();
  
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      const index = y * MAP_WIDTH + x;
      const biome = getBiomeAt(x, y, biomeRegions);
      const biomeConfig = BIOME_CONFIGS[biome];
      
      let tileId = biomeConfig.primaryTile;
      
      const noiseVal = noise2D(x, y, 50, random);
      const detailNoise = noise2D(x, y, 20, random);
      
      if (biome === 'forest') {
        if (noiseVal > 0.7) {
          tileId = getTileByName('tree')?.id ?? 1;
        } else if (noiseVal > 0.5) {
          tileId = getTileByName('forest_floor')?.id ?? 2;
        } else if (detailNoise > 0.85) {
          tileId = getTileByName('water')?.id ?? 12;
        } else {
          tileId = getTileByName('grass')?.id ?? 0;
        }
      } else if (biome === 'cave') {
        if (noiseVal > 0.6) {
          tileId = getTileByName('cave_wall')?.id ?? 4;
        } else if (detailNoise > 0.8) {
          tileId = getTileByName('stalactite')?.id ?? 5;
        } else if (detailNoise > 0.9) {
          tileId = getTileByName('lava')?.id ?? 13;
        } else {
          tileId = getTileByName('stone_floor')?.id ?? 3;
        }
      } else if (biome === 'ruins') {
        if (noiseVal > 0.65) {
          tileId = getTileByName('ruins_wall')?.id ?? 7;
        } else if (noiseVal > 0.4) {
          tileId = getTileByName('rubble')?.id ?? 8;
        } else {
          tileId = getTileByName('ruins_floor')?.id ?? 6;
        }
      } else if (biome === 'boss') {
        const distToCenter = Math.sqrt(
          Math.pow(x - (MAP_WIDTH * 0.75), 2) + 
          Math.pow(y - (MAP_HEIGHT * 0.75), 2)
        );
        
        if (distToCenter < 100) {
          tileId = getTileByName('boss_floor')?.id ?? 10;
        } else if (distToCenter < 150) {
          tileId = getTileByName('boss_door')?.id ?? 9;
        } else {
          tileId = getTileByName('boss_wall')?.id ?? 11;
        }
      }
      
      tiles[index] = tileId;
    }
  }
  
  return {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    tiles,
    biomes: biomeRegions,
  };
};

export const generateWaypoints = (map: TileMap): Waypoint[] => {
  const waypoints: Waypoint[] = [];
  
  const forestCenter = map.biomes.get('forest')!;
  waypoints.push({
    id: 'wp_forest_start',
    x: forestCenter.x + forestCenter.width / 2,
    y: forestCenter.y + forestCenter.height / 2,
    biome: 'forest',
    unlocked: true,
    name: 'Forest Camp',
  });
  
  const caveCenter = map.biomes.get('cave')!;
  waypoints.push({
    id: 'wp_cave_entry',
    x: caveCenter.x + 50,
    y: caveCenter.y + caveCenter.height / 2,
    biome: 'cave',
    unlocked: false,
    name: 'Cave Entrance',
  });
  
  const ruinsCenter = map.biomes.get('ruins')!;
  waypoints.push({
    id: 'wp_ruins_entry',
    x: ruinsCenter.x + ruinsCenter.width / 2,
    y: ruinsCenter.y + 50,
    biome: 'ruins',
    unlocked: false,
    name: 'Ruins Gate',
  });
  
  const bossCenter = map.biomes.get('boss')!;
  waypoints.push({
    id: 'wp_boss_chamber',
    x: bossCenter.x + bossCenter.width / 2,
    y: bossCenter.y + bossCenter.height / 2,
    biome: 'boss',
    unlocked: false,
    name: 'Boss Chamber',
  });
  
  return waypoints;
};

export const getTileAt = (map: TileMap, x: number, y: number): number => {
  if (x < 0 || x >= map.width || y < 0 || y >= map.height) {
    return -1;
  }
  return map.tiles[y * map.width + x];
};

export const setTileAt = (map: TileMap, x: number, y: number, tileId: number): void => {
  if (x < 0 || x >= map.width || y < 0 || y >= map.height) {
    return;
  }
  map.tiles[y * map.width + x] = tileId;
};

export const getBiomeAtPosition = (
  map: TileMap,
  x: number,
  y: number
): BiomeType => {
  return getBiomeAt(x, y, map.biomes);
};
