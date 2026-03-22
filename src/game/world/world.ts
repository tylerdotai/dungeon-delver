import type { Camera, RenderObject } from '../engine/renderer';
import type { TileMap, Waypoint, BiomeType } from './mapData';
import {
  TILE_SIZE,
  MAP_WIDTH,
  MAP_HEIGHT,
  generateProceduralMap,
  generateWaypoints,
  getTileAt,
  getTileById,
  isTileSolid,
  getTileDamage,
  getBiomeAtPosition,
} from './mapData';

export interface WorldConfig {
  seed?: number;
}

export class World {
  public map: TileMap;
  public waypoints: Waypoint[];
  public camera: Camera;
  private seed: number;

  constructor(config: WorldConfig = {}) {
    this.seed = config.seed ?? Date.now();
    this.map = generateProceduralMap(this.seed);
    this.waypoints = generateWaypoints(this.map);
    this.camera = {
      x: 0,
      y: 0,
      width: 800,
      height: 600,
    };
  }

  getSeed(): number {
    return this.seed;
  }

  setCameraDimensions(width: number, height: number): void {
    this.camera.width = width;
    this.camera.height = height;
  }

  updateCamera(target: RenderObject): void {
    this.camera.x = target.x + target.width / 2 - this.camera.width / 2;
    this.camera.y = target.y + target.height / 2 - this.camera.height / 2;

    this.camera.x = Math.max(0, Math.min(this.camera.x, MAP_WIDTH - this.camera.width));
    this.camera.y = Math.max(0, Math.min(this.camera.y, MAP_HEIGHT - this.camera.height));
  }

  worldToScreen(worldPos: { x: number; y: number }): { x: number; y: number } {
    return {
      x: worldPos.x - this.camera.x,
      y: worldPos.y - this.camera.y,
    };
  }

  screenToWorld(screenPos: { x: number; y: number }): { x: number; y: number } {
    return {
      x: screenPos.x + this.camera.x,
      y: screenPos.y + this.camera.y,
    };
  }

  render(ctx: CanvasRenderingContext2D): void {
    const startTileX = Math.floor(this.camera.x / TILE_SIZE);
    const startTileY = Math.floor(this.camera.y / TILE_SIZE);
    const endTileX = Math.ceil((this.camera.x + this.camera.width) / TILE_SIZE);
    const endTileY = Math.ceil((this.camera.y + this.camera.height) / TILE_SIZE);

    for (let y = startTileY; y <= endTileY; y++) {
      for (let x = startTileX; x <= endTileX; x++) {
        const tileId = getTileAt(this.map, x, y);
        if (tileId === -1) continue;

        const tile = getTileById(tileId);
        if (!tile) continue;

        const screenX = x * TILE_SIZE - this.camera.x;
        const screenY = y * TILE_SIZE - this.camera.y;

        ctx.fillStyle = tile.color;
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        if (tile.damage > 0) {
          ctx.strokeStyle = '#ff0000';
          ctx.lineWidth = 1;
          ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    this.renderWaypoints(ctx);
  }

  private renderWaypoints(ctx: CanvasRenderingContext2D): void {
    for (const waypoint of this.waypoints) {
      if (!waypoint.unlocked) continue;

      const screenPos = this.worldToScreen({ x: waypoint.x, y: waypoint.y });

      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(waypoint.name, screenPos.x, screenPos.y - 15);
    }
  }

  checkTileCollision(
    x: number,
    y: number,
    width: number,
    height: number
  ): { collided: boolean; tileId?: number; damage?: number } {
    const corners = [
      { x: x, y: y },
      { x: x + width, y: y },
      { x: x, y: y + height },
      { x: x + width, y: y + height },
      { x: x + width / 2, y: y },
      { x: x + width / 2, y: y + height },
      { x: x, y: y + height / 2 },
      { x: x + width, y: y + height / 2 },
    ];

    for (const corner of corners) {
      const tileX = Math.floor(corner.x / TILE_SIZE);
      const tileY = Math.floor(corner.y / TILE_SIZE);
      const tileId = getTileAt(this.map, tileX, tileY);

      if (tileId === -1) continue;

      if (isTileSolid(tileId)) {
        return { collided: true, tileId };
      }

      const damage = getTileDamage(tileId);
      if (damage > 0) {
        return { collided: false, tileId, damage };
      }
    }

    return { collided: false };
  }

  resolveTileCollision(
    x: number,
    y: number,
    width: number,
    height: number,
    proposedX: number,
    proposedY: number
  ): { x: number; y: number } {
    const xCollision = this.checkTileCollision(proposedX, y, width, height);
    const yCollision = this.checkTileCollision(x, proposedY, width, height);

    let newX = proposedX;
    let newY = proposedY;

    if (xCollision.collided) {
      newX = x;
    }
    if (yCollision.collided) {
      newY = y;
    }

    return { x: newX, y: newY };
  }

  getBiomeAt(x: number, y: number): BiomeType {
    return getBiomeAtPosition(this.map, x, y);
  }

  checkWaypointActivation(x: number, y: number): Waypoint | null {
    const activationRadius = 30;

    for (const waypoint of this.waypoints) {
      if (waypoint.unlocked) continue;

      const dx = x - waypoint.x;
      const dy = y - waypoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= activationRadius) {
        waypoint.unlocked = true;
        return waypoint;
      }
    }

    return null;
  }

  getNearestWaypoint(x: number, y: number): Waypoint | null {
    let nearest: Waypoint | null = null;
    let minDistance = Infinity;

    for (const waypoint of this.waypoints) {
      const dx = x - waypoint.x;
      const dy = y - waypoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        minDistance = distance;
        nearest = waypoint;
      }
    }

    return nearest;
  }

  getActiveWaypoints(): Waypoint[] {
    return this.waypoints.filter(wp => wp.unlocked);
  }

  getBiomeName(biome: BiomeType): string {
    const names: Record<BiomeType, string> = {
      forest: 'Forest',
      cave: 'Cave',
      ruins: 'Ruins',
      boss: 'Boss Chamber',
    };
    return names[biome] || 'Unknown';
  }

  getBiomeDangerLevel(biome: BiomeType): number {
    const dangers: Record<BiomeType, number> = {
      forest: 1,
      cave: 2,
      ruins: 3,
      boss: 4,
    };
    return dangers[biome] || 1;
  }
}

export const createWorld = (config?: WorldConfig): World => {
  return new World(config);
};

let worldInstance: World | null = null;

export const getWorld = (config?: WorldConfig): World => {
  if (!worldInstance) {
    worldInstance = createWorld(config);
  }
  return worldInstance;
};

export const resetWorld = (config?: WorldConfig): World => {
  worldInstance = createWorld(config);
  return worldInstance;
};
