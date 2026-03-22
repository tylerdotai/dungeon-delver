import { useState } from 'react';
import { useGameStore, type Item } from '../../store/gameStore';

interface InventoryItem extends Item {
  quantity: number;
}

interface InventoryScreenProps {
  onClose: () => void;
}

const INVENTORY_SIZE = 24;

const RARITY_COLORS: Record<string, string> = {
  common: '#a0a0a0',
  rare: '#3498db',
  epic: '#9b59b6',
  legendary: '#f39c12',
};

export function InventoryScreen({ onClose }: InventoryScreenProps) {
  const { items, player, healPlayer, addXP, updatePlayerStats } = useGameStore();
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const inventory: (InventoryItem | null)[] = [
    ...items.slice(0, INVENTORY_SIZE).map(item => ({ ...item, quantity: 1 })),
    ...Array(INVENTORY_SIZE - items.length).fill(null)
  ];

  const handleUseItem = (item: InventoryItem) => {
    switch (item.type) {
      case 'health':
        healPlayer(item.value);
        break;
      case 'xp':
        addXP(item.value);
        break;
      case 'weapon':
        updatePlayerStats({ atk: player.stats.atk + item.value });
        break;
      case 'armor':
        updatePlayerStats({ def: player.stats.def + item.value });
        break;
    }
  };

  return (
    <div className="pixel-ui">
      <div className="pixel-screen-overlay" onClick={onClose}>
        <div className="pixel-modal" onClick={e => e.stopPropagation()} style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 className="pixel-title" style={{ fontSize: '16px', margin: 0 }}>INVENTORY</h2>
            <button className="pixel-button secondary" onClick={onClose} style={{ padding: '8px 12px', fontSize: '10px' }}>
              CLOSE [ESC]
            </button>
          </div>

          <div style={{ display: 'flex', gap: '24px' }}>
            <div>
              <div style={{ fontSize: '10px', marginBottom: '8px' }}>ITEMS</div>
              <div className="inventory-grid">
                {inventory.map((item, index) => (
                  <div
                    key={index}
                    className={`slot ${selectedSlot === index ? 'selected' : ''} ${item ? 'filled' : ''}`}
                    onClick={() => {
                      setSelectedSlot(index);
                      if (item && item.type !== 'weapon' && item.type !== 'armor') {
                        handleUseItem(item);
                      }
                    }}
                    style={item ? { borderColor: RARITY_COLORS[item.type] || RARITY_COLORS.common } : {}}
                  >
                    {item && (
                      <div style={{ fontSize: '16px', textAlign: 'center' }}>
                        {item.type === 'health' ? '❤️' : item.type === 'xp' ? '✨' : item.type === 'weapon' ? '⚔️' : '🛡️'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ minWidth: '200px' }}>
              <div style={{ fontSize: '10px', marginBottom: '8px' }}>EQUIPMENT</div>
              <div className="equipment-slots">
                <div className="slot" style={{ width: '100%', height: '48px', justifyContent: 'flex-start', paddingLeft: '12px' }}>
                  <span style={{ fontSize: '8px', opacity: 0.7 }}>WEAPON</span>
                </div>
                <div className="slot" style={{ width: '100%', height: '48px', justifyContent: 'flex-start', paddingLeft: '12px' }}>
                  <span style={{ fontSize: '8px', opacity: 0.7 }}>ARMOR</span>
                </div>
                <div className="slot" style={{ width: '100%', height: '48px', justifyContent: 'flex-start', paddingLeft: '12px' }}>
                  <span style={{ fontSize: '8px', opacity: 0.7 }}>ACCESSORY</span>
                </div>
              </div>

              <div className="pixel-divider" style={{ margin: '16px 0' }} />

              <div style={{ fontSize: '10px', marginBottom: '8px' }}>STATS</div>
              <div style={{ fontSize: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span className="pixel-label">HP</span>
                  <span className="pixel-value">{player.stats.hp}/{player.stats.maxHp}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span className="pixel-label">ATK</span>
                  <span className="pixel-value">{player.stats.atk}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span className="pixel-label">DEF</span>
                  <span className="pixel-value">{player.stats.def}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="pixel-label">LVL</span>
                  <span className="pixel-value">{player.stats.level}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '16px', fontSize: '8px', color: 'var(--pixel-text-dim)' }}>
            Click item to use • Weapons/Armor equip automatically
          </div>
        </div>
      </div>
    </div>
  );
}
