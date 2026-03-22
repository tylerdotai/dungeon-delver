import { type ItemData, type ItemEffect } from '../../types';

export interface WeaponEffectResult {
  damage: number;
  effects: AppliedEffect[];
}

export interface AppliedEffect {
  effect: ItemEffect;
  value: number;
  duration: number;
}

export const getWeaponEffects = (weapon: ItemData | null): AppliedEffect[] => {
  if (!weapon || !weapon.effect) return [];
  
  return [{
    effect: weapon.effect,
    value: weapon.effectValue || 0,
    duration: weapon.effectDuration || 0,
  }];
};

export const calculateWeaponDamage = (baseAtk: number, weapon: ItemData | null): number => {
  if (!weapon) return baseAtk;
  
  const weaponAtk = weapon.stats.atk || 0;
  return baseAtk + weaponAtk;
};

export const applyWeaponEffects = (
  target: { takeDamage: (amount: number) => void; applyStatus?: (effect: string, duration: number, value: number) => void },
  weapon: ItemData | null
): WeaponEffectResult => {
  const effects: AppliedEffect[] = [];
  let bonusDamage = 0;
  
  if (weapon?.effect) {
    const effect: AppliedEffect = {
      effect: weapon.effect,
      value: weapon.effectValue || 0,
      duration: weapon.effectDuration || 0,
    };
    effects.push(effect);
    
    switch (weapon.effect) {
      case 'fire':
      case 'shock':
        bonusDamage = weapon.effectValue || 0;
        if (target.applyStatus) {
          target.applyStatus(weapon.effect === 'fire' ? 'burning' : 'shocked', weapon.effectDuration || 0, weapon.effectValue || 0);
        }
        break;
      case 'poison':
        if (target.applyStatus) {
          target.applyStatus('poisoned', weapon.effectDuration || 0, weapon.effectValue || 0);
        }
        break;
      case 'ice':
        if (target.applyStatus) {
          target.applyStatus('frozen', weapon.effectDuration || 0, weapon.effectValue || 0);
        }
        break;
    }
  }
  
  return { damage: bonusDamage, effects };
};

export const isWeapon = (item: ItemData | null): boolean => {
  return item?.type === 'weapon';
};

export const hasWeaponEffect = (weapon: ItemData | null): boolean => {
  return weapon?.effect !== undefined && weapon.effect !== null;
};
