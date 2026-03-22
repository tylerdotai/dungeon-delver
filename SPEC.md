# Dungeon Delver — Technical Specification

## 1. Project Overview

**Project Name:** Dungeon Delver  
**Type:** 2D Open World ARPG (Action RPG)  
**Core Functionality:** A single-player open world dungeon crawler where players explore a large map, fight monsters, collect loot, and complete quests.  
**Target Users:** Casual to mid-core RPG fans who enjoy exploration and loot collection.  
**Platform:** Web (React + Canvas) — responsive for desktop and tablet.

---

## 2. Gameplay Overview

### World
- **Map Size:** 2000x2000 pixels (scrollable canvas, camera follows player)
- **Biomes:** 4 distinct zones — Forest, Cave, Ruins, Boss Lair
- **Fast Travel:** 4 unlockable waypoints (one per biome)
- **Entities:** 50+ enemies, 30+ items, 10 NPCs

### Classes (Choose at Start)
| Class | HP | ATK | DEF | Special |
|-------|-----|-----|-----|---------|
| **Knight** | 150 | 12 | 8 | Shield block (25% damage reduction) |
| **Rogue** | 100 | 18 | 4 | Double strike (10% crit chance, 2x dmg) |
| **Mage** | 80 | 22 | 2 | Fireball (range spell, 30 AOE dmg) |

### Progression
- **Level System:** XP from kills + quests. Max level 20.
- **Stat Growth:** +10 HP, +2 ATK, +1 DEF per level.
- **Equipment:** Weapon, Armor, Accessory slots. Rarity: Common → Rare → Epic → Legendary.

### Quests (10 Total)
1. *First Steps* — Talk to the Elder (tutorial)
2. *Rat Problem* — Kill 10 forest rats
3. *The Lost Amulet* — Retrieve from cave entrance
4. *Goblin Scout* — Locate goblin camp
5. *Clear the Ruins* — Defeat 5 skeleton warriors
6. *The Chained Beast* — Free the trapped merchant
7. *Ingredients for the Alchemist* — Gather 3 herbs
8. *Shadow in the Depths* — Find the secret cave entrance
9. *The Final Stand* — Defeat the Warlord
10. *Legacy of the Delver* — Optional: defeat the hidden boss

---

## 3. Technical Architecture

### Stack
- **Frontend:** React 18 + Vite
- **Game Engine:** HTML5 Canvas (custom renderer)
- **State:** Zustand for game state management
- **Persistence:** localStorage (save/load character)
- **Styling:** CSS Modules

### File Structure
```
src/
├── components/
│   ├── Canvas/         # Main game canvas
│   ├── UI/             # HUD, inventory, dialogs
│   └── Screens/        # Title, character select, game over
├── game/
│   ├── engine/         # Game loop, collision, rendering
│   ├── entities/       # Player, enemies, NPCs
│   ├── items/          # Item definitions, loot tables
│   ├── quests/         # Quest logic and tracking
│   └── world/          # Map data, biomes, tiles
├── data/
│   ├── enemies.json
│   ├── items.json
│   ├── quests.json
│   └── tiles.json
└── store/
    └── gameStore.ts    # Zustand state
```

### Core Systems

**Game Loop**
- 60 FPS target via requestAnimationFrame
- Delta time for consistent movement
- Render → Update → Input processing

**Collision Detection**
- AABB (Axis-Aligned Bounding Box) for entity collision
- Tile-based collision for walls/terrain

**Combat**
- Auto-attack when enemy in range (click to attack)
- Cooldown system (attack speed per weapon)
- Damage formula: `ATK - DEF/2` (minimum 1 damage)

**Inventory**
- Grid: 4 rows × 6 columns
- Drag-and-drop equip
- Stackable consumables (potions)

---

## 4. UI/UX Specification

### Visual Style
- **Pixel art aesthetic** (16x16 or 32x32 tiles)
- **Palette:** Earthy tones — forest greens, cave browns, ruins gray, boss purple
- **Font:** "Press Start 2P" (Google Fonts) for retro feel

### Screens

**1. Title Screen**
- Game logo (centered)
- "New Game" button
- "Continue" button (if save exists)
- Credits

**2. Character Select**
- 3 class cards with stats preview
- "Select" button per class
- Name input field

**3. HUD (In-Game)**
- Top-left: HP bar + XP bar
- Top-right: Level indicator + Mini-map (150x150)
- Bottom: Quick-access inventory (4 slots)
- Center-bottom: Active quest text

**4. Inventory Screen** (toggle with 'I')
- Grid of 24 slots
- Item details on hover
- Equip/Use/Discard buttons

**5. Quest Log** (toggle with 'Q')
- List of active + completed quests
- Objectives with checkboxes

**6. Pause Menu** (ESC)
- Resume
- Save Game
- Quit to Title

### Color Palette
| Element | Hex |
|---------|-----|
| HP Bar | #E74C3C |
| XP Bar | #F1C40F |
| Mana/Energy | #3498DB |
| Gold | #F39C12 |
| Common | #95A5A6 |
| Rare | #2ECC71 |
| Epic | #9B59B6 |
| Legendary | #E67E22 |

---

## 5. Map Design

### Biomes

**1. Forest (Spawn)**
- Safe zone, low-level enemies (rats, wolves)
- Village with Elder NPC, Merchant, Alchemist
- Green grass tiles, tree obstacles

**2. Cave**
- Mid-level enemies (bats, spiders, goblins)
- Darker brown palette
- Narrow corridors, water hazards

**3. Ruins**
- High-level enemies (skeletons, undead)
- Gray stone, broken pillars
- Secret passages

**4. Boss Lair**
- Final boss arena
- Purple/dark theme
- No respawning enemies

### Tileset (32x32)
| ID | Name | Walkable | Description |
|----|------|----------|-------------|
| 0 | Grass | ✓ | Forest floor |
| 1 | Dirt | ✓ | Cave floor |
| 2 | Stone | ✓ | Ruins floor |
| 3 | Wall | ✗ | Impassable |
| 4 | Water | ✗ | Impassable |
| 5 | Tree | ✗ | Forest obstacle |
| 6 | Chest | ✓ (interact) | Loot container |
| 7 | Portal | ✓ (interact) | Waypoint unlock |

---

## 6. Enemy Data

| ID | Name | Biome | HP | ATK | XP | Drops |
|----|------|-------|-----|-----|-----|-------|
| rat | Rat | Forest | 20 | 3 | 5 | None |
| wolf | Wolf | Forest | 40 | 6 | 15 | Wolf Pelt |
| goblin | Goblin | Cave | 50 | 8 | 20 | Goblin Ear |
| spider | Spider | Cave | 35 | 10 | 25 | Spider Silk |
| skeleton | Skeleton | Ruins | 80 | 12 | 40 | Bone |
| wraith | Wraith | Ruins | 60 | 15 | 50 | Soul Shard |
| warlord | Warlord | Boss | 500 | 25 | 500 | Legendary Sword |

---

## 7. Item Data

### Weapons
| ID | Name | Rarity | ATK | Class | Effect |
|----|------|--------|-----|-------|--------|
| sword_iron | Iron Sword | Common | +5 | Knight | — |
| dagger_poison | Poison Dagger | Rare | +8 | Rogue | 2 dmg/3s |
| staff_fire | Fire Staff | Epic | +12 | Mage | +10% fire dmg |
| blade_legend | Delver's Blade | Legendary | +25 | All | +10% crit |

### Armor
| ID | Name | Rarity | DEF | Slot |
|----|------|--------|-----|------|
| vest_leather | Leather Vest | Common | +3 | Chest |
| armor_chain | Chainmail | Rare | +6 | Chest |
| robe_mystic | Mystic Robes | Epic | +4 | Chest | +20 MP |

### Consumables
| ID | Name | Effect |
|----|------|--------|
| potion_health | Health Potion | +50 HP |
| potion_mana | Mana Potion | +30 MP |

---

## 8. Acceptance Criteria

### Core Gameplay
- [ ] Player can move in 8 directions with WASD/Arrow keys
- [ ] Player can attack by clicking on enemies
- [ ] Enemies patrol and chase when player in range
- [ ] Combat deals correct damage with formulas
- [ ] Items can be equipped and affect stats
- [ ] Quests track progress and mark complete

### World
- [ ] Map renders with all 4 biomes visible
- [ ] Camera follows player smoothly
- [ ] Collision prevents walking through walls/trees
- [ ] Waypoints unlock and enable fast travel

### Progression
- [ ] XP awards on enemy death
- [ ] Level up increases stats
- [ ] Items drop with correct rarity
- [ ] Save/Load persists character data

### UI
- [ ] Title screen navigates to game
- [ ] Character select assigns class correctly
- [ ] HUD displays HP, XP, level accurately
- [ ] Inventory opens/closes, items draggable
- [ ] Quest log shows active objectives

---

## 9. Implementation Phases

| Phase | Focus | Deliverable |
|-------|-------|-------------|
| 1 | Engine | Game loop, canvas, input handling |
| 2 | Player | Movement, collision, stats |
| 3 | World | Map rendering, camera, tiles |
| 4 | Combat | Enemy AI, damage, death |
| 5 | Items | Inventory, equip, loot drops |
| 6 | Quests | Quest system, NPC dialogs |
| 7 | Polish | UI, sound, save/load |

**Estimated Timeline:** 20-30 hours total  
**First Playable:** Phase 4 (player can fight enemies)

---

*Spec generated for Flume SaaS Factory — Dungeon Delver*
