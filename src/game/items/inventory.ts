import itemsDataRaw from '../../data/items.json';
import { type ItemData, type ItemType, type Rarity, type Stats, type Vector2, type LootDrop, type ItemEffect } from '../../types';

const itemsData = itemsDataRaw as {
  items: ItemData[];
  rarityColors: Record<Rarity, string>;
  dropChances: Record<Rarity, number>;
};

export const INVENTORY_SIZE = 24;

export interface InventoryItem {
  item: ItemData;
  quantity: number;
}

export interface InventorySlot {
  index: number;
  item: InventoryItem | null;
}

export interface DragState {
  sourceSlot: number;
  item: ItemData;
  quantity: number;
}

export type ItemEffectCallback = (target: { takeDamage: (amount: number) => void; applyStatus?: (effect: string, duration: number, value: number) => void }, effect: ItemEffect, value: number, duration: number) => void;

const generateUID = (): string => {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

export const getItemById = (id: string): ItemData | undefined => {
  return itemsData.items.find(item => item.id === id);
};

export const getItemsByType = (type: ItemType): ItemData[] => {
  return itemsData.items.filter(item => item.type === type);
};

export const getItemsByRarity = (rarity: Rarity): ItemData[] => {
  return itemsData.items.filter(item => item.rarity === rarity);
};

export const getRarityColor = (rarity: Rarity): string => {
  return itemsData.rarityColors[rarity] || '#ffffff';
};

export const getRandomRarity = (): Rarity => {
  const rand = Math.random();
  const cumulative = {
    common: itemsData.dropChances.common,
    rare: itemsData.dropChances.common + itemsData.dropChances.rare,
    epic: itemsData.dropChances.common + itemsData.dropChances.rare + itemsData.dropChances.epic,
  };
  
  if (rand < cumulative.common) return 'common';
  if (rand < cumulative.rare) return 'rare';
  if (rand < cumulative.epic) return 'epic';
  return 'legendary';
};

export const getRandomItemByRarity = (rarity: Rarity): ItemData | null => {
  const items = getItemsByRarity(rarity);
  if (items.length === 0) return null;
  const index = Math.floor(Math.random() * items.length);
  return items[index];
};

export const createLootDrop = (position: Vector2, rarity?: Rarity): LootDrop | null => {
  const dropRarity = rarity || getRandomRarity();
  const item = getRandomItemByRarity(dropRarity);
  
  if (!item) return null;
  
  return {
    uid: generateUID(),
    item,
    position: { ...position },
    lifetime: 30000,
  };
};

export const createLootDropTable = (_enemyType: string, position: Vector2, isBoss: boolean = false): LootDrop[] => {
  const drops: LootDrop[] = [];
  
  const baseDropChance = isBoss ? 1.0 : 0.7;
  const numDrops = isBoss ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 2) + 1;
  
  for (let i = 0; i < numDrops; i++) {
    if (Math.random() <= baseDropChance) {
      const rarity = isBoss 
        ? getWeightedRarityForBoss() 
        : getRandomRarity();
      const drop = createLootDrop({ x: position.x + (Math.random() * 20 - 10), y: position.y + (Math.random() * 20 - 10) }, rarity);
      if (drop) drops.push(drop);
    }
  }
  
  return drops;
};

const getWeightedRarityForBoss = (): Rarity => {
  const rand = Math.random();
  if (rand < 0.4) return 'common';
  if (rand < 0.65) return 'rare';
  if (rand < 0.85) return 'epic';
  return 'legendary';
};

export class Inventory {
  private slots: (InventoryItem | null)[];
  private equipment: { weapon: ItemData | null; armor: ItemData | null; accessory: ItemData | null };
  private dragState: DragState | null = null;

  constructor() {
    this.slots = Array(INVENTORY_SIZE).fill(null);
    this.equipment = {
      weapon: null,
      armor: null,
      accessory: null,
    };
  }

  getSlots(): (InventoryItem | null)[] {
    return [...this.slots];
  }

  getEquipment() {
    return { ...this.equipment };
  }

  getSlot(index: number): InventoryItem | null {
    if (index < 0 || index >= INVENTORY_SIZE) return null;
    return this.slots[index];
  }

  getDragState(): DragState | null {
    return this.dragState;
  }

  addItem(itemId: string, quantity: number = 1): boolean {
    const item = getItemById(itemId);
    if (!item) return false;

    if (item.stackable && item.consumable) {
      const existingSlot = this.findStackableSlot(itemId);
      if (existingSlot !== -1) {
        const slot = this.slots[existingSlot];
        if (slot) {
          const maxStack = item.maxStack || 10;
          const availableSpace = maxStack - slot.quantity;
          if (availableSpace >= quantity) {
            slot.quantity += quantity;
            return true;
          } else {
            slot.quantity = maxStack;
            quantity -= availableSpace;
          }
        }
      }
    }

    const emptySlot = this.findEmptySlot();
    if (emptySlot === -1) return false;

    this.slots[emptySlot] = { item, quantity };
    return true;
  }

  removeItem(slotIndex: number, quantity?: number): ItemData | null {
    if (slotIndex < 0 || slotIndex >= INVENTORY_SIZE) return null;
    
    const slot = this.slots[slotIndex];
    if (!slot) return null;

    if (quantity === undefined || quantity >= slot.quantity) {
      this.slots[slotIndex] = null;
      return slot.item;
    }

    slot.quantity -= quantity;
    return slot.item;
  }

  startDrag(slotIndex: number): boolean {
    const slot = this.getSlot(slotIndex);
    if (!slot) return false;

    this.dragState = {
      sourceSlot: slotIndex,
      item: slot.item,
      quantity: slot.quantity,
    };
    return true;
  }

  endDrag(): void {
    this.dragState = null;
  }

  dropOnSlot(targetSlot: number): boolean {
    if (!this.dragState) return false;

    const sourceSlot = this.dragState.sourceSlot;
    if (sourceSlot === targetSlot) {
      this.dragState = null;
      return true;
    }

    const targetItem = this.slots[targetSlot];
    const sourceItem = this.slots[sourceSlot];

    if (!sourceItem) {
      this.dragState = null;
      return false;
    }

    if (targetItem && targetItem.item.id === sourceItem.item.id && sourceItem.item.stackable) {
      const maxStack = sourceItem.item.maxStack || 10;
      const availableSpace = maxStack - targetItem.quantity;
      const toTransfer = Math.min(this.dragState.quantity, availableSpace);
      
      targetItem.quantity += toTransfer;
      const remaining = this.dragState.quantity - toTransfer;
      
      if (remaining > 0) {
        sourceItem.quantity = remaining;
      } else {
        this.slots[sourceSlot] = null;
      }
    } else {
      this.slots[targetSlot] = sourceItem;
      this.slots[sourceSlot] = targetItem;
    }

    this.dragState = null;
    return true;
  }

  equipItem(slotIndex: number): boolean {
    const slot = this.getSlot(slotIndex);
    if (!slot) return false;

    const equipSlot = slot.item.equipSlot;
    if (!equipSlot) return false;

    const currentEquip = this.equipment[equipSlot];
    this.equipment[equipSlot] = slot.item;

    if (currentEquip) {
      this.slots[slotIndex] = currentEquip ? { item: currentEquip, quantity: 1 } : null;
    } else {
      this.slots[slotIndex] = null;
    }

    return true;
  }

  unequipItem(equipSlot: 'weapon' | 'armor' | 'accessory'): boolean {
    const item = this.equipment[equipSlot];
    if (!item) return false;

    const emptySlot = this.findEmptySlot();
    if (emptySlot === -1) return false;

    this.equipment[equipSlot] = null;
    this.slots[emptySlot] = { item, quantity: 1 };
    return true;
  }

  useItem(slotIndex: number, target?: { takeDamage: (amount: number) => void; applyStatus?: (effect: string, duration: number, value: number) => void }): boolean {
    const slot = this.getSlot(slotIndex);
    if (!slot || !slot.item.consumable) return false;

    if (slot.item.effect) {
      applyItemEffect(target, slot.item.effect, slot.item.effectValue || 0, slot.item.effectDuration || 0);
    }

    this.removeItem(slotIndex, 1);
    return true;
  }

  private findEmptySlot(): number {
    return this.slots.findIndex(slot => slot === null);
  }

  private findStackableSlot(itemId: string): number {
    const item = getItemById(itemId);
    if (!item || !item.stackable) return -1;
    
    const maxStack = item.maxStack || 10;
    return this.slots.findIndex(slot => 
      slot && slot.item.id === itemId && slot.quantity < maxStack
    );
  }

  getTotalStats(): Partial<Stats> {
    const total: Partial<Stats> = {};
    
    const addStats = (stats: Partial<Stats>) => {
      for (const [key, value] of Object.entries(stats)) {
        if (typeof value === 'number') {
          (total as Record<string, number>)[key] = ((total as Record<string, number>)[key] || 0) + value;
        }
      }
    };

    const equipStats = this.equipment;
    if (equipStats.weapon) addStats(equipStats.weapon.stats);
    if (equipStats.armor) addStats(equipStats.armor.stats);
    if (equipStats.accessory) addStats(equipStats.accessory.stats);

    return total;
  }

  hasItem(itemId: string, quantity: number = 1): boolean {
    let total = 0;
    for (const slot of this.slots) {
      if (slot && slot.item.id === itemId) {
        total += slot.quantity;
      }
    }
    return total >= quantity;
  }

  clear(): void {
    this.slots = Array(INVENTORY_SIZE).fill(null);
    this.equipment = { weapon: null, armor: null, accessory: null };
  }
}

export const applyItemEffect = (
  target: { takeDamage?: (amount: number) => void; applyStatus?: (effect: string, duration: number, value: number) => void } | undefined,
  effect: string,
  value: number,
  duration: number
): void => {
  switch (effect) {
    case 'poison':
      if (target?.applyStatus) {
        target.applyStatus('poison', duration, value);
      }
      break;
    case 'fire':
      if (target?.takeDamage && value > 0) {
        target.takeDamage(value);
      }
      if (target?.applyStatus) {
        target.applyStatus('burning', duration, value);
      }
      break;
    case 'ice':
      if (target?.applyStatus) {
        target.applyStatus('frozen', duration, value);
      }
      break;
    case 'shock':
      if (target?.takeDamage && value > 0) {
        target.takeDamage(value);
      }
      if (target?.applyStatus) {
        target.applyStatus('stunned', duration / 2, 0);
      }
      break;
    case 'blessing':
      if (target?.applyStatus) {
        target.applyStatus('blessing', duration, value);
      }
      break;
    case 'heal':
      break;
  }
};

export const createInventory = (): Inventory => {
  return new Inventory();
};

export const RARITY_MULTIPLIERS: Record<Rarity, number> = {
  common: 1,
  rare: 1.5,
  epic: 2.5,
  legendary: 5,
};

export const calculateItemValue = (item: ItemData): number => {
  const baseValue = item.value || 10;
  const rarityMultiplier = RARITY_MULTIPLIERS[item.rarity];
  
  let statValue = 0;
  for (const [, stat] of Object.entries(item.stats)) {
    if (typeof stat === 'number') {
      statValue += stat;
    }
  }
  
  return Math.floor((baseValue + statValue * 2) * rarityMultiplier);
};
