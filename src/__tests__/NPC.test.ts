import { describe, it, expect, beforeEach } from 'vitest';
import { NPC, Elder, Merchant, Alchemist, createNPC, getNPCTypeColor, type NPCConfig, type NPCType } from '../game/entities/NPC';

const createMockConfig = (type: NPCType = 'elder'): NPCConfig => ({
  id: `test_${type}`,
  type,
  x: 100,
  y: 100,
  width: 32,
  height: 32,
  name: `Test ${type.charAt(0).toUpperCase() + type.slice(1)}`,
  color: '#FFFFFF',
  biome: 'forest',
});

describe('NPC Base Class', () => {
  let npc: NPC;

  beforeEach(() => {
    npc = new NPC(createMockConfig('elder'));
  });

  describe('initialization', () => {
    it('should create NPC with correct properties', () => {
      expect(npc.id).toBe('test_elder');
      expect(npc.type).toBe('elder');
      expect(npc.x).toBe(100);
      expect(npc.y).toBe(100);
      expect(npc.width).toBe(32);
      expect(npc.height).toBe(32);
      expect(npc.name).toBe('Test Elder');
      expect(npc.color).toBe('#FFFFFF');
      expect(npc.biome).toBe('forest');
    });

    it('should return correct AABB', () => {
      const aabb = npc.getAABB();
      expect(aabb).toEqual({ x: 100, y: 100, width: 32, height: 32 });
    });

    it('should return correct position', () => {
      const pos = npc.getPosition();
      expect(pos).toEqual({ x: 100, y: 100 });
    });
  });

  describe('position', () => {
    it('should set position via setPosition', () => {
      npc.setPosition(200, 300);
      expect(npc.x).toBe(200);
      expect(npc.y).toBe(300);
    });
  });

  describe('dialog system', () => {
    it('should start dialog', () => {
      const node = npc.startDialog();
      expect(node).not.toBeNull();
      expect(node?.id).toBe('start');
    });

    it('should continue dialog', () => {
      npc.startDialog();
      const node = npc.continueDialog('end');
      expect(node).not.toBeNull();
      expect(node?.id).toBe('end');
    });

    it('should return null for invalid node', () => {
      npc.startDialog();
      const node = npc.continueDialog('invalid_node');
      expect(node).toBeNull();
    });

    it('should select choice by index', () => {
      const elder = new Elder(createMockConfig('elder'));
      elder.startDialog();
      const nextNode = elder.selectChoice(0);
      expect(nextNode).not.toBeNull();
    });

    it('should return null for invalid choice index', () => {
      npc.startDialog();
      const nextNode = npc.selectChoice(999);
      expect(nextNode).toBeNull();
    });

    it('should end dialog', () => {
      npc.startDialog();
      expect(npc.isInDialog()).toBe(true);
      npc.endDialog();
      expect(npc.isInDialog()).toBe(false);
    });
  });

  describe('shop functionality', () => {
    it('should return empty shop items by default', () => {
      const items = npc.getShopItems();
      expect(items).toEqual([]);
    });

    it('should check affordability', () => {
      expect(npc.canAfford(100, 50)).toBe(true);
      expect(npc.canAfford(30, 50)).toBe(false);
    });

    it('should return failure for non-existent item purchase', () => {
      const result = npc.buyItem('nonexistent', 1, 100);
      expect(result.success).toBe(false);
      expect(result.remainingGold).toBe(100);
    });
  });
});

describe('Elder NPC', () => {
  let elder: Elder;

  beforeEach(() => {
    elder = new Elder(createMockConfig('elder'));
  });

  describe('initialization', () => {
    it('should create Elder with correct properties', () => {
      expect(elder.type).toBe('elder');
      expect(elder.name).toBe('Test Elder');
    });
  });

  describe('dialog', () => {
    it('should have quest-related dialog options', () => {
      const node = elder.startDialog();
      expect(node?.choices?.length).toBeGreaterThan(0);
    });

    it('should have lore option', () => {
      elder.startDialog();
      const node = elder.continueDialog('lore');
      expect(node).not.toBeNull();
      expect(node?.text).toContain('village');
    });
  });

  describe('quest thanks message', () => {
    it('should return quest thanks message', () => {
      const message = elder.getQuestThanksMessage();
      expect(message).toBe('Thank you for your service to our people.');
    });
  });
});

describe('Merchant NPC', () => {
  let merchant: Merchant;

  beforeEach(() => {
    merchant = new Merchant(createMockConfig('merchant'));
  });

  describe('initialization', () => {
    it('should create Merchant with correct properties', () => {
      expect(merchant.type).toBe('merchant');
      expect(merchant.name).toBe('Test Merchant');
    });
  });

  describe('shop', () => {
    it('should have default shop items', () => {
      const items = merchant.getShopItems();
      expect(items.length).toBeGreaterThan(0);
      expect(items.find(i => i.itemId === 'iron_sword')).toBeDefined();
    });

    it('should add shop item', () => {
      merchant.addShopItem({ itemId: 'new_item', quantity: 5, price: 50 });
      const items = merchant.getShopItems();
      expect(items.find(i => i.itemId === 'new_item')?.quantity).toBe(5);
    });

    it('should increment quantity when adding existing item', () => {
      merchant.addShopItem({ itemId: 'iron_sword', quantity: 2, price: 100 });
      const items = merchant.getShopItems();
      expect(items.find(i => i.itemId === 'iron_sword')?.quantity).toBe(3);
    });

    it('should remove shop item', () => {
      merchant.removeShopItem('iron_sword', 1);
      const items = merchant.getShopItems();
      expect(items.find(i => i.itemId === 'iron_sword')).toBeDefined();
    });

    it('should completely remove item when quantity reaches zero', () => {
      const initialItems = merchant.getShopItems();
      const swordItem = initialItems.find(i => i.itemId === 'iron_sword');
      if (swordItem) {
        merchant.removeShopItem('iron_sword', swordItem.quantity);
        const items = merchant.getShopItems();
        expect(items.find(i => i.itemId === 'iron_sword')).toBeUndefined();
      }
    });

    it('should fail to remove more quantity than available', () => {
      const result = merchant.removeShopItem('iron_sword', 999);
      expect(result).toBe(false);
    });
  });

  describe('dialog', () => {
    it('should have buy and sell dialog options', () => {
      const node = merchant.startDialog();
      expect(node?.choices?.length).toBe(3);
      const choiceTexts = node?.choices?.map(c => c.text) || [];
      expect(choiceTexts).toContain('I would like to buy something.');
      expect(choiceTexts).toContain('I have items to sell.');
    });
  });
});

describe('Alchemist NPC', () => {
  let alchemist: Alchemist;

  beforeEach(() => {
    alchemist = new Alchemist(createMockConfig('alchemist'));
  });

  describe('initialization', () => {
    it('should create Alchemist with correct properties', () => {
      expect(alchemist.type).toBe('alchemist');
      expect(alchemist.name).toBe('Test Alchemist');
    });
  });

  describe('shop', () => {
    it('should have potion shop items', () => {
      const items = alchemist.getShopItems();
      expect(items.length).toBeGreaterThan(0);
      expect(items.find(i => i.itemId === 'health_potion')).toBeDefined();
      expect(items.find(i => i.itemId === 'mana_potion')).toBeDefined();
    });

    it('should have elixirs', () => {
      const items = alchemist.getShopItems();
      expect(items.find(i => i.itemId === 'elixir_strength')).toBeDefined();
      expect(items.find(i => i.itemId === 'elixir_speed')).toBeDefined();
    });
  });

  describe('potion knowledge', () => {
    it('should have default potion knowledge', () => {
      const knowledge = alchemist.getPotionKnowledge();
      expect(knowledge.length).toBeGreaterThan(0);
      expect(knowledge).toContain('Health potions restore vitality.');
    });

    it('should add new potion recipe', () => {
      alchemist.addPotionRecipe('new_recipe');
      const knowledge = alchemist.getPotionKnowledge();
      expect(knowledge).toContain('New recipe: new_recipe');
    });

    it('should not duplicate potion recipe', () => {
      alchemist.addPotionRecipe('health_potion');
      alchemist.addPotionRecipe('health_potion');
      const knowledge = alchemist.getPotionKnowledge();
      const newRecipeCount = knowledge.filter(k => k === 'New recipe: health_potion').length;
      expect(newRecipeCount).toBe(1);
    });
  });

  describe('dialog', () => {
    it('should have knowledge dialog option', () => {
      const node = alchemist.startDialog();
      expect(node?.choices?.length).toBe(3);
      const choiceTexts = node?.choices?.map(c => c.text) || [];
      expect(choiceTexts).toContain('What do you know about potions?');
    });

    it('should provide knowledge when selected', () => {
      alchemist.startDialog();
      const node = alchemist.continueDialog('knowledge');
      expect(node?.text).toContain('Health potions');
    });
  });
});

describe('createNPC factory', () => {
  it('should create Elder NPC', () => {
    const npc = createNPC(createMockConfig('elder'));
    expect(npc).toBeInstanceOf(Elder);
    expect(npc.type).toBe('elder');
  });

  it('should create Merchant NPC', () => {
    const npc = createNPC(createMockConfig('merchant'));
    expect(npc).toBeInstanceOf(Merchant);
    expect(npc.type).toBe('merchant');
  });

  it('should create Alchemist NPC', () => {
    const npc = createNPC(createMockConfig('alchemist'));
    expect(npc).toBeInstanceOf(Alchemist);
    expect(npc.type).toBe('alchemist');
  });

  it('should throw error for unknown NPC type', () => {
    expect(() => createNPC({ ...createMockConfig(), type: 'unknown' as NPCType })).toThrow('Unknown NPC type');
  });
});

describe('getNPCTypeColor', () => {
  it('should return brown for elder', () => {
    expect(getNPCTypeColor('elder')).toBe('#8B4513');
  });

  it('should return gold for merchant', () => {
    expect(getNPCTypeColor('merchant')).toBe('#FFD700');
  });

  it('should return purple for alchemist', () => {
    expect(getNPCTypeColor('alchemist')).toBe('#9932CC');
  });

  it('should return correct colors for all valid types', () => {
    expect(getNPCTypeColor('elder')).toBe('#8B4513');
    expect(getNPCTypeColor('merchant')).toBe('#FFD700');
    expect(getNPCTypeColor('alchemist')).toBe('#9932CC');
  });
});

describe('NPC render', () => {
  it('should render NPC to canvas context', () => {
    const npc = new NPC(createMockConfig('elder'));
    const ctx = {
      fillStyle: '',
      fillRect: () => {},
      font: '',
      textAlign: '',
      fillText: () => {},
    } as unknown as CanvasRenderingContext2D;

    npc.render(ctx, 0, 0);
    expect(ctx.fillStyle).toBe('#fff');
  });
});
