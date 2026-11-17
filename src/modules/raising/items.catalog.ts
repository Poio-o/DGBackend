export interface ItemDefinition {
  id: string;
  name: string;
  category: 'FOOD' | 'MEDICINE' | 'TRAINING';
  iconUrl: string;
  description: string;
  hungerRestore: number;
  friendshipGain: number;
}

export const FOOD_CATALOG: Record<string, ItemDefinition> = {
  meat_common: {
    id: 'meat_common',
    name: 'Carne Común',
    category: 'FOOD',
    iconUrl: '/icons/items/meat_common.png',
    description: 'Carne básica para alimentar Digimons.',
    hungerRestore: 25,
    friendshipGain: 1,
  },
  meat_giant: {
    id: 'meat_giant',
    name: 'Carne Gigante',
    category: 'FOOD',
    iconUrl: '/icons/items/meat_giant.png',
    description: 'Carne nutritiva que sacia el doble.',
    hungerRestore: 50,
    friendshipGain: 2,
  },
  sirloin: {
    id: 'sirloin',
    name: 'Solomillo Selecto',
    category: 'FOOD',
    iconUrl: '/icons/items/sirloin.png',
    description: 'Carne de la más alta calidad, elimina todo el hambre.',
    hungerRestore: 100,
    friendshipGain: 5,
  },
};

export function findItemById(itemId: string): ItemDefinition | null {
  return FOOD_CATALOG[itemId] ?? null;
}
