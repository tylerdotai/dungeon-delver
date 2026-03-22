import { type AABB, type Vector2 } from '../engine';
import { type ItemData, type Biome, type DialogNode, type QuestData } from '../../types';
import { getItemById, calculateItemValue } from '../items/inventory';
import { questSystem } from '../quests/questSystem';

export type NPCType = 'elder' | 'merchant' | 'alchemist';

export interface NPCConfig {
  id: string;
  type: NPCType;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  color: string;
  biome: Biome;
}

export interface DialogOption {
  text: string;
  nextNodeId: string | null;
  action?: () => void;
}

export interface ShopItem {
  itemId: string;
  quantity: number;
  price: number;
}

export class NPC {
  public id: string;
  public type: NPCType;
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public name: string;
  public color: string;
  public biome: Biome;

  protected dialogTree: Map<string, DialogNode> = new Map();
  protected shopItems: ShopItem[] = [];
  protected currentDialogNode: string | null = null;

  constructor(config: NPCConfig) {
    this.id = config.id;
    this.type = config.type;
    this.x = config.x;
    this.y = config.y;
    this.width = config.width;
    this.height = config.height;
    this.name = config.name;
    this.color = config.color;
    this.biome = config.biome;

    this.initializeDialog();
    this.initializeShop();
  }

  protected initializeDialog(): void {
    this.dialogTree.set('start', {
      id: 'start',
      text: `Hello, traveler. I am ${this.name}.`,
      next: 'end',
    });

    this.dialogTree.set('end', {
      id: 'end',
      text: 'Goodbye.',
    });
  }

  protected initializeShop(): void {}

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

  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  startDialog(): DialogNode | null {
    const startNode = this.dialogTree.get('start');
    if (startNode) {
      this.currentDialogNode = 'start';
      return { ...startNode };
    }
    return null;
  }

  continueDialog(nodeId: string): DialogNode | null {
    const node = this.dialogTree.get(nodeId);
    if (node) {
      this.currentDialogNode = nodeId;
      return { ...node };
    }
    return null;
  }

  selectChoice(choiceIndex: number): DialogNode | null {
    const currentNode = this.currentDialogNode
      ? this.dialogTree.get(this.currentDialogNode)
      : null;

    if (!currentNode?.choices || choiceIndex >= currentNode.choices.length) {
      return null;
    }

    const choice = currentNode.choices[choiceIndex];
    if (choice.next) {
      return this.continueDialog(choice.next);
    }
    return null;
  }

  endDialog(): void {
    this.currentDialogNode = null;
  }

  isInDialog(): boolean {
    return this.currentDialogNode !== null;
  }

  getShopItems(): ShopItem[] {
    return [...this.shopItems];
  }

  canAfford(playerGold: number, itemPrice: number): boolean {
    return playerGold >= itemPrice;
  }

  buyItem(itemId: string, quantity: number, playerGold: number): { success: boolean; remainingGold: number; item: ItemData | null } {
    const shopItem = this.shopItems.find(si => si.itemId === itemId);
    if (!shopItem) {
      return { success: false, remainingGold: playerGold, item: null };
    }

    const totalCost = shopItem.price * quantity;
    if (playerGold < totalCost) {
      return { success: false, remainingGold: playerGold, item: null };
    }

    const item = getItemById(itemId);
    if (!item) {
      return { success: false, remainingGold: playerGold, item: null };
    }

    return {
      success: true,
      remainingGold: playerGold - totalCost,
      item,
    };
  }

  sellItem(item: ItemData, quantity: number): number {
    const sellPrice = Math.floor(calculateItemValue(item) * 0.5);
    return sellPrice * quantity;
  }

  getAvailableQuests(): QuestData[] {
    return questSystem.getAvailableQuests(this.id);
  }

  hasQuests(): boolean {
    return this.getAvailableQuests().length > 0;
  }

  render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;

    ctx.fillStyle = this.color;
    ctx.fillRect(screenX, screenY, this.width, this.height);

    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.name, screenX + this.width / 2, screenY - 8);
  }
}

export class Elder extends NPC {
  private greeting: string;

  constructor(config: NPCConfig) {
    super(config);
    this.greeting = 'Greetings, brave one. The village needs your help.';
  }

  getQuestThanksMessage(): string {
    return 'Thank you for your service to our people.';
  }

  protected initializeDialog(): void {
    this.dialogTree.set('start', {
      id: 'start',
      text: this.greeting,
      choices: [
        { text: 'Do you have any tasks for me?', next: 'quests' },
        { text: 'Tell me about this place.', next: 'lore' },
        { text: 'Goodbye.', next: 'end' },
      ],
    });

    this.dialogTree.set('quests', {
      id: 'quests',
      text: 'I have a few tasks that need completing.',
      choices: [
        { text: 'I will help.', next: 'accept_quest' },
        { text: 'Not right now.', next: 'end' },
      ],
    });

    this.dialogTree.set('accept_quest', {
      id: 'accept_quest',
      text: 'Thank you. May fortune favor you.',
      next: 'end',
    });

    this.dialogTree.set('lore', {
      id: 'lore',
      text: 'This village has stood for generations. Dark forces gather in the nearby dungeons.',
      next: 'end',
    });

    this.dialogTree.set('end', {
      id: 'end',
      text: 'Safe travels.',
    });
  }
}

export class Merchant extends NPC {
  private static defaultShopItems: ShopItem[] = [
    { itemId: 'iron_sword', quantity: 1, price: 100 },
    { itemId: 'iron_armor', quantity: 1, price: 150 },
    { itemId: 'health_potion', quantity: 5, price: 20 },
    { itemId: 'mana_potion', quantity: 5, price: 25 },
  ];

  constructor(config: NPCConfig) {
    super(config);
  }

  protected initializeDialog(): void {
    this.dialogTree.set('start', {
      id: 'start',
      text: 'Welcome, traveler! Browse my wares.',
      choices: [
        { text: 'I would like to buy something.', next: 'buy' },
        { text: 'I have items to sell.', next: 'sell' },
        { text: 'Goodbye.', next: 'end' },
      ],
    });

    this.dialogTree.set('buy', {
      id: 'buy',
      text: 'Take a look at what I have for sale.',
      next: 'end',
    });

    this.dialogTree.set('sell', {
      id: 'sell',
      text: 'What would you like to sell?',
      next: 'end',
    });

    this.dialogTree.set('end', {
      id: 'end',
      text: 'Come back anytime!',
    });
  }

  protected initializeShop(): void {
    this.shopItems = [...Merchant.defaultShopItems];
  }

  addShopItem(item: ShopItem): void {
    const existing = this.shopItems.find(si => si.itemId === item.itemId);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      this.shopItems.push(item);
    }
  }

  removeShopItem(itemId: string, quantity: number): boolean {
    const shopItem = this.shopItems.find(si => si.itemId === itemId);
    if (!shopItem) return false;

    if (shopItem.quantity >= quantity) {
      shopItem.quantity -= quantity;
      if (shopItem.quantity <= 0) {
        this.shopItems = this.shopItems.filter(si => si.itemId !== itemId);
      }
      return true;
    }
    return false;
  }
}

export class Alchemist extends NPC {
  private static defaultShopItems: ShopItem[] = [
    { itemId: 'health_potion', quantity: 10, price: 20 },
    { itemId: 'mana_potion', quantity: 10, price: 25 },
    { itemId: 'antidote', quantity: 5, price: 30 },
    { itemId: 'elixir_strength', quantity: 3, price: 100 },
    { itemId: 'elixir_speed', quantity: 3, price: 100 },
  ];

  private defaultKnowledge: string[] = [
    'Health potions restore vitality.',
    'Mana potions replenish magical energy.',
    'Antidotes cure poison.',
  ];
  private potionKnowledge: string[] = [];

  constructor(config: NPCConfig) {
    super(config);
    this.potionKnowledge = [...this.defaultKnowledge];
    this.setupKnowledgeDialog();
  }

  private setupKnowledgeDialog(): void {
    this.dialogTree.set('knowledge', {
      id: 'knowledge',
      text: this.potionKnowledge.join(' '),
      next: 'end',
    });
  }

  protected initializeDialog(): void {
    this.dialogTree.set('start', {
      id: 'start',
      text: 'Ah, a customer. I specialize in potions and elixirs.',
      choices: [
        { text: 'Show me your potions.', next: 'shop' },
        { text: 'What do you know about potions?', next: 'knowledge' },
        { text: 'Goodbye.', next: 'end' },
      ],
    });

    this.dialogTree.set('shop', {
      id: 'shop',
      text: 'Select what you need.',
      next: 'end',
    });

    this.dialogTree.set('end', {
      id: 'end',
      text: 'Farewell, alchemist.',
    });
  }

  protected initializeShop(): void {
    this.shopItems = [...Alchemist.defaultShopItems];
  }

  getPotionKnowledge(): string[] {
    return [...this.potionKnowledge];
  }

  addPotionRecipe(itemId: string): void {
    const newRecipe = `New recipe: ${itemId}`;
    if (!this.potionKnowledge.includes(newRecipe)) {
      this.potionKnowledge.push(newRecipe);
    }
  }
}

export type NPCClass = Elder | Merchant | Alchemist;

export const createNPC = (config: NPCConfig): NPC => {
  switch (config.type) {
    case 'elder':
      return new Elder(config);
    case 'merchant':
      return new Merchant(config);
    case 'alchemist':
      return new Alchemist(config);
    default:
      throw new Error(`Unknown NPC type: ${config.type}`);
  }
};

export const getNPCTypeColor = (type: NPCType): string => {
  switch (type) {
    case 'elder':
      return '#8B4513';
    case 'merchant':
      return '#FFD700';
    case 'alchemist':
      return '#9932CC';
    default:
      return '#808080';
  }
};
