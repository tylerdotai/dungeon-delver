#!/bin/bash
# Dungeon Delver Build Loop - Complete all 7 phases

cd /Users/soup/.openclaw/workspace/products/dungeon-delver

echo "=== Starting Dungeon Delver Build Loop ==="

# Phase prompts
declare -a PHASES=(
    "Phase 3 - World: Create src/game/world/mapData.ts with 2000x2000 procedural tile map, 4 biomes (Forest/Cave/Ruins/Boss). Create src/data/tiles.json with tile definitions (grass, dirt, stone, wall, water, tree, chest, portal). Create src/game/world/world.ts for map rendering, camera follow, biome logic, tile collision. Implement waypoints."
    "Phase 4 - Combat: Create src/game/entities/Enemy.ts with patrol and chase AI (detect player within 150px). Create src/data/enemies.json with all enemies (rat, wolf, goblin, spider, skeleton, wraith, warlord). Implement combat: damage formula (ATK - DEF/2, min 1), enemy death, XP rewards, respawn logic."
    "Phase 5 - Items: Create src/game/items/inventory.ts with 24-slot grid, drag-drop equip. Create src/data/items.json with weapons, armor, consumables. Implement loot drops on enemy death with rarity system (common/rare/epic/legendary). Add item effects (poison dagger, fire staff)."
    "Phase 6 - Quests: Create src/game/quests/questSystem.ts with 10 quests from SPEC.md. Create src/data/quests.json with objectives, rewards. Create src/game/entities/NPC.ts for Elder, Merchant, Alchemist. Implement dialog system, quest tracking, waypoint unlock."
    "Phase 7 - Polish & UI: Create all UI components: TitleScreen, CharacterSelect, HUD (HP/XP bars, level, minimap, quick slots), InventoryScreen, QuestLogScreen, PauseMenu. Add save/load to localStorage. Add keyboard shortcuts (I=inventory, Q=quests, ESC=pause). Pixel art styling with Press Start 2P font."
)

for i in "${!PHASES[@]}"; do
    PHASE=$((i+3))
    echo ""
    echo "=== Phase $PHASE ==="
    echo "${PHASES[$i]}"
    
    kilo run "${PHASES[$i]} Fix any LSP/TypeScript errors. Ensure build passes: npm run build." --model kilo/kilo-auto/free 2>&1
    
    # Verify build
    if npm run build 2>&1 | grep -q "built in"; then
        echo "✓ Phase $PHASE complete"
    else
        echo "⚠ Phase $PHASE build failed, retrying..."
        kilo run "Fix the build errors and ensure npm run build passes." --model kilo/kilo-auto/free 2>&1
    fi
done

echo ""
echo "=== Build Complete - Running Final Verification ==="
npm run build
ls -la src/
echo "=== Done ==="