# Dungeon Delver

A browser-based RPG game built with TypeScript, Vite, and HTML5 Canvas.

## Features

- **Procedural World**: 2000x2000 tile map with 4 biomes (Forest, Cave, Ruins, Boss)
- **Combat System**: Real-time combat with enemy AI (patrol, chase), damage formula, XP rewards
- **Inventory**: 24-slot grid with drag-drop equipment, rarity system (common/rare/epic/legendary)
- **Quest System**: 10 quests with objectives, rewards, and NPC givers
- **NPCs**: Elder (quests), Merchant (shop), Alchemist (potions)
- **UI Screens**: TitleScreen, CharacterSelect, HUD, Inventory, QuestLog, PauseMenu
- **Save/Load**: localStorage persistence
- **Controls**: I=inventory, Q=quests, ESC=pause

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

## Tech Stack

- TypeScript
- Vite
- HTML5 Canvas
- Vitest (testing)

## Classes

- **Player**: Character with stats, inventory, combat
- **Enemy**: AI enemies with patrol/chase behavior
- **NPC**: Quest givers and shopkeepers (Elder, Merchant, Alchemist)
- **Quest**: Quest tracking and objectives

## License

MIT
