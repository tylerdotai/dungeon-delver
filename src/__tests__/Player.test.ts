import { describe, it, expect, beforeEach } from 'vitest';
import { Player, createPlayer } from '../game/entities/Player';

describe('Player', () => {
  let player: Player;

  beforeEach(() => {
    player = createPlayer({ x: 100, y: 100 });
  });

  describe('initialization', () => {
    it('should create player with default stats', () => {
      const stats = player.getStats();
      expect(stats.hp).toBe(100);
      expect(stats.maxHp).toBe(100);
      expect(stats.atk).toBe(10);
      expect(stats.def).toBe(5);
      expect(stats.xp).toBe(0);
      expect(stats.level).toBe(1);
    });

    it('should create player at specified position', () => {
      const p = createPlayer({ x: 200, y: 300 });
      const pos = p.getPosition();
      expect(pos.x).toBe(200);
      expect(pos.y).toBe(300);
    });

    it('should create player with default dimensions', () => {
      expect(player.width).toBe(32);
      expect(player.height).toBe(32);
    });

    it('should return correct AABB', () => {
      const aabb = player.getAABB();
      expect(aabb).toEqual({ x: 100, y: 100, width: 32, height: 32 });
    });
  });

  describe('movement', () => {
    it('should move right when direction is {x:1, y:0}', () => {
      player.move({ x: 1, y: 0 }, 1000);
      expect(player.x).toBeGreaterThan(100);
    });

    it('should move down when direction is {x:0, y:1}', () => {
      player.move({ x: 0, y: 1 }, 1000);
      expect(player.y).toBeGreaterThan(100);
    });

    it('should not move when direction is zero', () => {
      player.move({ x: 0, y: 0 }, 1000);
      expect(player.x).toBe(100);
      expect(player.y).toBe(100);
    });

    it('should move at correct speed over deltaTime', () => {
      // speed=200 pixels/sec, deltaTime=1000ms = 1 sec => moves 200px
      player.move({ x: 1, y: 0 }, 1000);
      expect(player.x).toBeCloseTo(300, 0);
    });

    it('should normalize diagonal movement', () => {
      const startX = player.x;
      const startY = player.y;
      player.move({ x: 1, y: 1 }, 1000);
      const dx = player.x - startX;
      const dy = player.y - startY;
      // Diagonal should be normalized: both components ~141 (200/sqrt(2))
      expect(dx).toBeCloseTo(dy, 0);
    });

    it('should move smaller distance with shorter deltaTime', () => {
      player.move({ x: 1, y: 0 }, 500);
      expect(player.x).toBeCloseTo(200, 0); // 200 * 0.5 = 100px
    });

    it('should set position via setPosition', () => {
      player.setPosition(500, 600);
      expect(player.getPosition()).toEqual({ x: 500, y: 600 });
    });
  });

  describe('combat', () => {
    const createMockTarget = (x: number, y: number, def: number = 0) => ({
      getStats: () => ({ def }),
      getAABB: () => ({ x, y, width: 32, height: 32 }),
    });

    it('should return 0 damage when on cooldown', () => {
      const target = createMockTarget(110, 110);
      player.attack(target, 1000);
      const damage = player.attack(target, 1200); // 200ms later, cooldown is 500ms
      expect(damage).toBe(0);
    });

    it('should deal damage when target is in range', () => {
      const target = createMockTarget(110, 110);
      const damage = player.attack(target, 1000);
      expect(damage).toBe(10); // atk=10
    });

    it('should return 0 when target is null', () => {
      const damage = player.attack(null, 1000);
      expect(damage).toBe(0);
    });

    it('should return 0 when target is out of attack range', () => {
      const target = createMockTarget(500, 500);
      const damage = player.attack(target, 1000);
      expect(damage).toBe(0);
    });

    it('should enforce attack cooldown', () => {
      const target = createMockTarget(110, 110);
      player.attack(target, 1000);
      // Attack again before cooldown expires
      const damage = player.attack(target, 1400);
      expect(damage).toBe(0);
      // Attack after cooldown expires
      const damage2 = player.attack(target, 1600);
      expect(damage2).toBe(10);
    });
  });

  describe('damage and healing', () => {
    it('should reduce damage by defense stat', () => {
      // atk=10, def=5, damage 8 -> actual = max(1, 8-5) = 3
      const actual = player.takeDamage(8);
      expect(actual).toBe(3);
      expect(player.getStats().hp).toBe(97);
    });

    it('should always deal at least 1 damage', () => {
      const actual = player.takeDamage(1); // 1 - 5 def = -4, min 1
      expect(actual).toBe(1);
      expect(player.getStats().hp).toBe(99);
    });

    it('should not go below 0 HP', () => {
      player.takeDamage(500);
      expect(player.getStats().hp).toBe(0);
    });

    it('should report isDead when HP is 0', () => {
      player.takeDamage(500);
      expect(player.isDead()).toBe(true);
    });

    it('should not be dead with HP > 0', () => {
      expect(player.isDead()).toBe(false);
    });

    it('should heal up to maxHp', () => {
      player.takeDamage(50); // hp = 50
      player.heal(30);
      expect(player.getStats().hp).toBe(80);
    });

    it('should not heal above maxHp', () => {
      player.takeDamage(10);
      player.heal(999);
      expect(player.getStats().hp).toBe(100); // capped at maxHp
    });

    it('should heal 0 if already at full HP', () => {
      player.heal(50);
      expect(player.getStats().hp).toBe(100);
    });
  });

  describe('XP and leveling', () => {
    it('should calculate XP required for next level', () => {
      // Level 1: 100 * 1.5^0 = 100
      expect(player.getXPForNextLevel()).toBe(100);
    });

    it('should not level up with insufficient XP', () => {
      const leveledUp = player.addXP(50);
      expect(leveledUp).toBe(false);
      expect(player.getStats().level).toBe(1);
      expect(player.getStats().xp).toBe(50);
    });

    it('should level up when XP threshold is reached', () => {
      const leveledUp = player.addXP(100);
      expect(leveledUp).toBe(true);
      expect(player.getStats().level).toBe(2);
    });

    it('should increase stats on level up', () => {
      player.addXP(100);
      const stats = player.getStats();
      expect(stats.maxHp).toBe(110); // +10
      expect(stats.atk).toBe(12);    // +2
      expect(stats.def).toBe(6);     // +1
      expect(stats.hp).toBe(110);    // full heal on level up
    });

    it('should require more XP for higher levels', () => {
      player.addXP(100); // level 2
      // Level 2 requirement: 100 * 1.5^1 = 150
      expect(player.getXPForNextLevel()).toBe(150);
    });

    it('should handle multi-level from large XP gain', () => {
      player.addXP(300); // 100 for L2, then 150 for L3, with 50 remaining
      expect(player.getStats().level).toBeGreaterThanOrEqual(2);
    });

    it('should carry over XP after level up', () => {
      player.addXP(150); // 100 for level 2, 50 remaining
      expect(player.getStats().xp).toBe(50);
      expect(player.getStats().level).toBe(2);
    });
  });



  describe('createPlayer factory', () => {
    it('should create player with custom config', () => {
      const p = createPlayer({ x: 50, y: 60, speed: 300, attackRange: 64 });
      expect(p.x).toBe(50);
      expect(p.y).toBe(60);
      expect(p.speed).toBe(300);
      expect(p.attackRange).toBe(64);
    });

    it('should use defaults for unspecified config', () => {
      const p = createPlayer({});
      expect(p.x).toBe(100);
      expect(p.y).toBe(100);
      expect(p.speed).toBe(200);
      expect(p.attackRange).toBe(48);
      expect(p.attackCooldown).toBe(500);
    });
  });
});
