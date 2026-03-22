import { type AABB, type Vector2 } from '../engine';

export interface PlayerStats {
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  xp: number;
  level: number;
}

export interface PlayerConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  attackRange: number;
  attackCooldown: number;
}

const LEVEL_UP_XP_BASE = 100;
const LEVEL_UP_XP_MULTIPLIER = 1.5;

export class Player {
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public speed: number;
  public attackRange: number;
  public attackCooldown: number;
  public lastAttackTime: number = 0;
  public isAttacking: boolean = false;

  private stats: PlayerStats = {
    hp: 100,
    maxHp: 100,
    atk: 10,
    def: 5,
    xp: 0,
    level: 1,
  };

  constructor(config: PlayerConfig) {
    this.x = config.x;
    this.y = config.y;
    this.width = config.width;
    this.height = config.height;
    this.speed = config.speed;
    this.attackRange = config.attackRange;
    this.attackCooldown = config.attackCooldown;
  }

  getStats(): PlayerStats {
    return { ...this.stats };
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

  move(direction: Vector2, deltaTime: number): void {
    const normalized = this.normalizeDirection(direction);
    this.x += normalized.x * this.speed * (deltaTime / 1000);
    this.y += normalized.y * this.speed * (deltaTime / 1000);
  }

  private normalizeDirection(dir: Vector2): Vector2 {
    const magnitude = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
    if (magnitude === 0) return { x: 0, y: 0 };
    return {
      x: dir.x / magnitude,
      y: dir.y / magnitude,
    };
  }

  attack(target: { getStats: () => { def: number }; getAABB: () => AABB } | null, currentTime: number): number {
    if (currentTime - this.lastAttackTime < this.attackCooldown) {
      return 0;
    }

    this.lastAttackTime = currentTime;
    this.isAttacking = true;

    if (target) {
      const attackBox: AABB = {
        x: this.x + this.width / 2 - this.attackRange / 2,
        y: this.y + this.height / 2 - this.attackRange / 2,
        width: this.attackRange,
        height: this.attackRange,
      };

      const targetAABB = target.getAABB();
      if (
        targetAABB.x < attackBox.x + attackBox.width &&
        targetAABB.x + targetAABB.width > attackBox.x &&
        targetAABB.y < attackBox.y + attackBox.height &&
        targetAABB.y + targetAABB.height > attackBox.y
      ) {
        const targetDef = target.getStats().def;
        return this.calculateDamage(targetDef);
      }
    }

    return 0;
  }

  private calculateDamage(targetDef: number): number {
    return Math.max(1, Math.floor(this.stats.atk - targetDef / 2));
  }

  takeDamage(amount: number): number {
    const actualDamage = Math.max(1, amount - this.stats.def);
    this.stats.hp = Math.max(0, this.stats.hp - actualDamage);
    return actualDamage;
  }

  heal(amount: number): void {
    this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + amount);
  }

  addXP(amount: number): boolean {
    this.stats.xp += amount;
    return this.checkLevelUp();
  }

  private checkLevelUp(): boolean {
    const xpRequired = this.getXPForNextLevel();
    if (this.stats.xp >= xpRequired) {
      this.levelUp();
      return true;
    }
    return false;
  }

  private levelUp(): void {
    this.stats.level += 1;
    this.stats.maxHp += 10;
    this.stats.hp = this.stats.maxHp;
    this.stats.atk += 2;
    this.stats.def += 1;
  }

  getXPForNextLevel(): number {
    return Math.floor(LEVEL_UP_XP_BASE * Math.pow(LEVEL_UP_XP_MULTIPLIER, this.stats.level - 1));
  }

  isDead(): boolean {
    return this.stats.hp <= 0;
  }

  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  updateFromStore(stats: PlayerStats): void {
    this.stats = { ...stats };
  }
}

export const createPlayer = (config: Partial<PlayerConfig> = {}): Player => {
  return new Player({
    x: config.x ?? 100,
    y: config.y ?? 100,
    width: config.width ?? 32,
    height: config.height ?? 32,
    speed: config.speed ?? 200,
    attackRange: config.attackRange ?? 48,
    attackCooldown: config.attackCooldown ?? 500,
  });
};
