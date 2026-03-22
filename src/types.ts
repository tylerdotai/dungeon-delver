export type GameScreen = 'title' | 'character-select' | 'playing' | 'paused' | 'game-over';

export type CharacterClass = 'knight' | 'rogue' | 'mage';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export type Biome = 'forest' | 'cave' | 'ruins' | 'boss';

export type TileType = 'grass' | 'dirt' | 'stone' | 'wall' | 'water' | 'tree' | 'chest' | 'portal';

export type EnemyType = 'rat' | 'wolf' | 'goblin' | 'spider' | 'skeleton' | 'wraith' | 'warlord';

export type ItemType = 'weapon' | 'armor' | 'consumable' | 'material';

export type EquipSlot = 'weapon' | 'armor' | 'accessory';

export type EnemyState = 'idle' | 'patrol' | 'chase' | 'attack' | 'dead';

export interface Vector2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Stats {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  speed: number;
  level: number;
  xp: number;
  xpToNext: number;
}

export interface ClassConfig {
  id: CharacterClass;
  name: string;
  hp: number;
  atk: number;
  def: number;
  special: string;
  speed: number;
}

export interface PlayerData {
  name: string;
  characterClass: CharacterClass;
  stats: Stats;
  position: Vector2;
  direction: 'up' | 'down' | 'left' | 'right';
  isAttacking: boolean;
  attackCooldown: number;
  inventory: InventorySlot[];
  equipment: Equipment;
  quests: QuestProgress[];
  waypoints: string[];
}

export interface Equipment {
  weapon: ItemData | null;
  armor: ItemData | null;
  accessory: ItemData | null;
}

export interface InventorySlot {
  item: ItemData | null;
  quantity: number;
}

export interface ItemData {
  id: string;
  name: string;
  type: ItemType;
  rarity: Rarity;
  description: string;
  stats: Partial<Stats>;
  equipSlot?: EquipSlot;
  consumable?: boolean;
  effect?: ItemEffect;
  effectValue?: number;
  effectDuration?: number;
  stackable?: boolean;
  maxStack?: number;
  value?: number;
}

export type ItemEffect = 'poison' | 'fire' | 'ice' | 'shock' | 'blessing' | 'heal';

export interface TileData {
  id: number;
  name: TileType;
  walkable: boolean;
  color: string;
}

export interface EnemyData {
  id: EnemyType;
  name: string;
  biome: Biome;
  hp: number;
  atk: number;
  def: number;
  xp: number;
  speed: number;
  drops: string[];
  dropChance: number;
  patrolRadius: number;
  aggroRange: number;
  attackRange: number;
  attackCooldown: number;
  width: number;
  height: number;
  color: string;
}

export interface EnemyInstance {
  uid: string;
  type: EnemyType;
  position: Vector2;
  stats: Stats;
  state: EnemyState;
  patrolOrigin: Vector2;
  targetPosition: Vector2 | null;
  attackTimer: number;
  lastDirection: Vector2;
  stunTimer: number;
  alive: boolean;
}

export interface NPCData {
  id: string;
  name: string;
  position: Vector2;
  biome: Biome;
  sprite: string;
  color: string;
  dialog: DialogNode[];
  questGiver?: string;
}

export interface DialogNode {
  id: string;
  text: string;
  next?: string;
  choices?: DialogChoice[];
  questTrigger?: string;
}

export interface DialogChoice {
  text: string;
  next: string;
}

export interface QuestObjective {
  id: string;
  type: 'kill' | 'collect' | 'talk' | 'explore' | 'interact';
  description: string;
  target: string;
  required: number;
  current: number;
  completed: boolean;
}

export interface QuestData {
  id: string;
  name: string;
  description: string;
  biome: Biome;
  objectives: Omit<QuestObjective, 'current' | 'completed'>[];
  rewards: { xp: number; items?: string[]; gold?: number };
  prerequisites?: string[];
  level: number;
  npcGiver: string;
}

export interface QuestProgress {
  questId: string;
  status: 'available' | 'active' | 'completed';
  objectives: QuestObjective[];
}

export interface Camera {
  x: number;
  y: number;
  width: number;
  height: number;
  target: Vector2;
}

export interface MapData {
  width: number;
  height: number;
  tileSize: number;
  tiles: number[][];
  biomes: BiomeRegion[];
  spawnPoint: Vector2;
  enemySpawns: EnemySpawn[];
  npcPositions: NPCData[];
  itemSpawns: ItemSpawn[];
}

export interface BiomeRegion {
  type: Biome;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EnemySpawn {
  type: EnemyType;
  position: Vector2;
}

export interface ItemSpawn {
  itemId: string;
  position: Vector2;
}

export interface DamageNumber {
  x: number;
  y: number;
  value: number;
  color: string;
  lifetime: number;
}

export interface LootDrop {
  uid: string;
  item: ItemData;
  position: Vector2;
  lifetime: number;
}

export interface GameState {
  screen: GameScreen;
  player: PlayerData | null;
  enemies: EnemyInstance[];
  damageNumbers: DamageNumber[];
  lootDrops: LootDrop[];
  map: MapData | null;
  camera: Camera;
  inventoryOpen: boolean;
  questLogOpen: boolean;
  dialogActive: NPCData | null;
  dialogNode: string | null;
  gameTime: number;
  selectedClass: CharacterClass | null;
}
