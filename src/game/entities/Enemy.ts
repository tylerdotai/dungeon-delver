import { type AABB, type Vector2 } from '../engine';
import enemiesData from '../../data/enemies.json';
import { createLootDropTable } from '../items/inventory';
import { type LootDrop } from '../../types';

export interface EnemyData {
  id: string;
  name: string;
  biome: string[];
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  xpReward: number;
  speed: number;
  width: number;
  height: number;
  color: string;
  detectionRange: number;
  attackRange: number;
  attackCooldown: number;
  damage: number;
  patrolRadius: number;
  behavior: string;
  isBoss?: boolean;
}

export interface SpawnRate {
  enemyId: string;
  weight: number;
}

export interface EnemyConfig {
  x: number;
  y: number;
  enemyId: string;
  onLootDrop?: (drops: LootDrop[]) => void;
}

const DETECTION_RANGE = 150;
const RESPAWN_TIME = 30000;

export const EnemyState = {
  PATROL: 'patrol',
  CHASE: 'chase',
  ATTACK: 'attack',
  DEAD: 'dead',
} as const;

export type EnemyState = typeof EnemyState[keyof typeof EnemyState];

export class Enemy {
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public speed: number;
  public color: string;
  public name: string;
  public isBoss: boolean;

  private hp: number;
  private maxHp: number;
  private atk: number;
  private def: number;
  private xpReward: number;
  private detectionRange: number;
  private attackRange: number;
  private attackCooldown: number;
  private patrolRadius: number;

  private state: EnemyState = EnemyState.PATROL;
  private spawnX: number;
  private spawnY: number;
  private patrolTarget: Vector2;
  private lastAttackTime: number = 0;
  private respawnTimer: number = 0;
  private isDead: boolean = false;
  private onLootDrop?: (drops: LootDrop[]) => void;

  constructor(config: EnemyConfig) {
    const enemyData = this.getEnemyData(config.enemyId);
    if (!enemyData) {
      throw new Error(`Enemy type ${config.enemyId} not found`);
    }

    this.x = config.x;
    this.y = config.y;
    this.spawnX = config.x;
    this.spawnY = config.y;
    this.width = enemyData.width;
    this.height = enemyData.height;
    this.speed = enemyData.speed;
    this.color = enemyData.color;
    this.name = enemyData.name;
    this.hp = enemyData.hp;
    this.maxHp = enemyData.maxHp;
    this.atk = enemyData.atk;
    this.def = enemyData.def;
    this.xpReward = enemyData.xpReward;
    this.detectionRange = enemyData.detectionRange;
    this.attackRange = enemyData.attackRange;
    this.attackCooldown = enemyData.attackCooldown;
    this.patrolRadius = enemyData.patrolRadius;
    this.isBoss = enemyData.isBoss || false;
    this.onLootDrop = config.onLootDrop;

    this.patrolTarget = this.generatePatrolTarget();
  }

  private getEnemyData(id: string): EnemyData | undefined {
    return enemiesData.enemies.find(e => e.id === id);
  }

  static getAllEnemies(): EnemyData[] {
    return enemiesData.enemies;
  }

  static getEnemyById(id: string): EnemyData | undefined {
    return enemiesData.enemies.find(e => e.id === id);
  }

  static getSpawnRatesForBiome(biome: string): SpawnRate[] {
    return (enemiesData.spawnRates as Record<string, SpawnRate[]>)[biome] || [];
  }

  static getRandomEnemyForBiome(biome: string): string | null {
    const rates = this.getSpawnRatesForBiome(biome);
    if (rates.length === 0) return null;

    const totalWeight = rates.reduce((sum, r) => sum + r.weight, 0);
    let random = Math.random() * totalWeight;

    for (const rate of rates) {
      random -= rate.weight;
      if (random <= 0) {
        return rate.enemyId;
      }
    }

    return rates[0].enemyId;
  }

  private generatePatrolTarget(): Vector2 {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * this.patrolRadius;
    return {
      x: this.spawnX + Math.cos(angle) * distance,
      y: this.spawnY + Math.sin(angle) * distance,
    };
  }

  getAABB(): AABB {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  getPosition(): Vector2 {
    return { x: this.x, y: this.y };
  }

  getHP(): number {
    return this.hp;
  }

  getMaxHP(): number {
    return this.maxHp;
  }

  getXPReward(): number {
    return this.xpReward;
  }

  getState(): EnemyState {
    return this.state;
  }

  isAlive(): boolean {
    return !this.isDead;
  }

  private distanceTo(target: Vector2): number {
    const dx = target.x - (this.x + this.width / 2);
    const dy = target.y - (this.y + this.height / 2);
    return Math.sqrt(dx * dx + dy * dy);
  }

  private normalizeDirection(dir: Vector2): Vector2 {
    const magnitude = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
    if (magnitude === 0) return { x: 0, y: 0 };
    return {
      x: dir.x / magnitude,
      y: dir.y / magnitude,
    };
  }

  update(deltaTime: number, player: { getPosition: () => Vector2; getAABB: () => AABB; getStats: () => { atk: number; def: number }; takeDamage: (amount: number) => void }): void {
    if (this.isDead) {
      this.respawnTimer += deltaTime;
      if (this.respawnTimer >= RESPAWN_TIME) {
        this.respawn();
      }
      return;
    }

    const playerPos = player.getPosition();
    const distToPlayer = this.distanceTo(playerPos);

    if (distToPlayer <= this.detectionRange || distToPlayer <= DETECTION_RANGE) {
      this.state = EnemyState.CHASE;
    } else {
      this.state = EnemyState.PATROL;
    }

    if (this.state === EnemyState.CHASE) {
      if (distToPlayer <= this.attackRange) {
        this.state = EnemyState.ATTACK;
        this.attack(player, Date.now());
      } else {
        this.chase(playerPos, deltaTime);
      }
    } else if (this.state === EnemyState.PATROL) {
      this.patrol(deltaTime);
    }
  }

  private chase(playerPos: Vector2, deltaTime: number): void {
    const dir = {
      x: playerPos.x - this.x,
      y: playerPos.y - this.y,
    };
    const normalized = this.normalizeDirection(dir);
    this.x += normalized.x * this.speed * (deltaTime / 1000);
    this.y += normalized.y * this.speed * (deltaTime / 1000);
  }

  private patrol(deltaTime: number): void {
    const distToTarget = this.distanceTo(this.patrolTarget);

    if (distToTarget < 10) {
      this.patrolTarget = this.generatePatrolTarget();
      return;
    }

    const dir = {
      x: this.patrolTarget.x - this.x,
      y: this.patrolTarget.y - this.y,
    };
    const normalized = this.normalizeDirection(dir);
    const patrolSpeed = this.speed * 0.5;
    this.x += normalized.x * patrolSpeed * (deltaTime / 1000);
    this.y += normalized.y * patrolSpeed * (deltaTime / 1000);
  }

  private attack(player: { getPosition: () => Vector2; getAABB: () => AABB; getStats: () => { atk: number; def: number }; takeDamage: (amount: number) => void }, currentTime: number): void {
    if (currentTime - this.lastAttackTime < this.attackCooldown) {
      return;
    }

    this.lastAttackTime = currentTime;
    const playerStats = player.getStats();
    const damage = this.calculateDamage(playerStats.def);
    player.takeDamage(damage);
  }

  private calculateDamage(playerDef: number): number {
    const rawDamage = this.atk - playerDef / 2;
    return Math.max(1, Math.floor(rawDamage));
  }

  takeDamage(amount: number): void {
    if (this.isDead) {
      return;
    }

    const actualDamage = Math.max(1, amount - this.def);
    this.hp -= actualDamage;
    if (this.hp <= 0) {
      this.die();
    }
  }

  private die(): void {
    this.isDead = true;
    this.state = EnemyState.DEAD;
    this.respawnTimer = 0;
    
    if (this.onLootDrop) {
      const drops = createLootDropTable(
        this.name,
        { x: this.x + this.width / 2, y: this.y + this.height / 2 },
        this.isBoss
      );
      if (drops.length > 0) {
        this.onLootDrop(drops);
      }
    }
  }

  private respawn(): void {
    this.isDead = false;
    this.state = EnemyState.PATROL;
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.hp = this.maxHp;
    this.patrolTarget = this.generatePatrolTarget();
  }

  render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    if (this.isDead) return;

    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;

    ctx.fillStyle = this.color;
    ctx.fillRect(screenX, screenY, this.width, this.height);

    const hpBarWidth = this.width;
    const hpBarHeight = 4;
    const hpBarY = screenY - 10;

    ctx.fillStyle = '#333';
    ctx.fillRect(screenX, hpBarY, hpBarWidth, hpBarHeight);

    const hpPercent = this.hp / this.maxHp;
    ctx.fillStyle = hpPercent > 0.5 ? '#00ff00' : hpPercent > 0.25 ? '#ffff00' : '#ff0000';
    ctx.fillRect(screenX, hpBarY, hpBarWidth * hpPercent, hpBarHeight);
  }
}

export const createEnemy = (config: EnemyConfig): Enemy => {
  return new Enemy(config);
};
