import { useState } from 'react';
import { type CharacterClass } from '../../types';

interface CharacterSelectProps {
  onSelect: (characterClass: CharacterClass) => void;
  onBack: () => void;
}

const CHARACTERS: Array<{
  id: CharacterClass;
  name: string;
  icon: string;
  hp: number;
  atk: number;
  def: number;
  speed: number;
  description: string;
}> = [
  {
    id: 'knight',
    name: 'KNIGHT',
    icon: '⚔️',
    hp: 120,
    atk: 12,
    def: 8,
    speed: 150,
    description: 'Balanced warrior with high defense',
  },
  {
    id: 'rogue',
    name: 'ROGUE',
    icon: '🗡️',
    hp: 80,
    atk: 15,
    def: 4,
    speed: 220,
    description: 'Fast attacker with low health',
  },
  {
    id: 'mage',
    name: 'MAGE',
    icon: '🔮',
    hp: 70,
    atk: 18,
    def: 3,
    speed: 140,
    description: 'Glass cannon with magic damage',
  },
];

export function CharacterSelect({ onSelect, onBack }: CharacterSelectProps) {
  const [selected, setSelected] = useState<CharacterClass | null>(null);

  const handleConfirm = () => {
    if (selected) {
      onSelect(selected);
    }
  };

  return (
    <div className="pixel-ui">
      <div className="pixel-screen-overlay">
        <div className="pixel-container" style={{ maxWidth: '600px' }}>
          <h2 className="pixel-title" style={{ fontSize: '20px', marginBottom: '24px' }}>
            CHOOSE YOUR HERO
          </h2>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '16px',
            marginBottom: '24px'
          }}>
            {CHARACTERS.map((char) => (
              <div
                key={char.id}
                className={`character-card ${selected === char.id ? 'selected' : ''}`}
                onClick={() => setSelected(char.id)}
              >
                <div className="character-icon">{char.icon}</div>
                <div style={{ fontSize: '10px', marginBottom: '12px' }}>{char.name}</div>
                
                <div style={{ fontSize: '8px', color: 'var(--pixel-text-dim)', marginBottom: '8px' }}>
                  {char.description}
                </div>
                
                <div className="pixel-divider" style={{ margin: '8px 0' }} />
                
                <div style={{ fontSize: '8px', textAlign: 'left', paddingLeft: '8px' }}>
                  <div>HP: {char.hp}</div>
                  <div>ATK: {char.atk}</div>
                  <div>DEF: {char.def}</div>
                  <div>SPD: {char.speed}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="pixel-button secondary" onClick={onBack}>
              BACK
            </button>
            <button 
              className="pixel-button" 
              onClick={handleConfirm}
              disabled={!selected}
            >
              START GAME
            </button>
          </div>

          <div className="keybind-hint" style={{ marginTop: '16px', textAlign: 'center' }}>
            Press 1, 2, or 3 to select • ENTER to confirm
          </div>
        </div>
      </div>
    </div>
  );
}
