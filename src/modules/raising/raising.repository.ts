import { AppError } from '../../utils/errors';
import { RaisingCalculator } from './raisingCalculator';
import type { ItemDefinition } from './items.catalog';
import {
  RAISING_BALANCE,
  calculateTotalStats,
  type FeedResult,
  type PlayerDigimon,
  type RestResult,
  type TrainResult,
  type TrainableStat,
  type UserInventoryItem,
} from './raising.types';

export class RaisingRepository {
  private static digimons = new Map<string, PlayerDigimon>();
  private static inventory = new Map<string, UserInventoryItem>();

  private static getInventoryKey(userId: string, itemId: string): string {
    return `${userId}:${itemId}`;
  }

  private static getStatKeys(stat: TrainableStat): {
    baseKey: keyof PlayerDigimon;
    npKey: keyof PlayerDigimon;
    bonusKey: keyof PlayerDigimon;
  } {
    switch (stat) {
      case 'HP':
        return { baseKey: 'baseHp', npKey: 'npHp', bonusKey: 'bonusHp' };
      case 'SP':
        return { baseKey: 'baseSp', npKey: 'npSp', bonusKey: 'bonusSp' };
      case 'ATK':
        return { baseKey: 'baseAtk', npKey: 'npAtk', bonusKey: 'bonusAtk' };
      case 'DEF':
        return { baseKey: 'baseDef', npKey: 'npDef', bonusKey: 'bonusDef' };
      case 'INT':
        return { baseKey: 'baseInt', npKey: 'npInt', bonusKey: 'bonusInt' };
      case 'SPI':
        return { baseKey: 'baseSpi', npKey: 'npSpi', bonusKey: 'bonusSpi' };
      case 'SPD':
        return { baseKey: 'baseSpd', npKey: 'npSpd', bonusKey: 'bonusSpd' };
    }
  }

  public static async findDigimonById(
    id: string
  ): Promise<PlayerDigimon | null> {
    const digimon = this.digimons.get(id);
    return digimon ? { ...digimon } : null;
  }

  public static async saveDigimon(
    digimon: PlayerDigimon
  ): Promise<PlayerDigimon> {
    const copy = { ...digimon };
    this.digimons.set(copy.id, copy);
    return { ...copy };
  }

  public static async getUserInventoryItem(
    userId: string,
    itemId: string
  ): Promise<UserInventoryItem | null> {
    const key = this.getInventoryKey(userId, itemId);
    const item = this.inventory.get(key);
    return item ? { ...item } : null;
  }

  public static async setUserInventoryItem(
    userId: string,
    itemId: string,
    quantity: number,
    assignedDigimonId: string | null = null
  ): Promise<UserInventoryItem> {
    const key = this.getInventoryKey(userId, itemId);
    const existing = this.inventory.get(key);
    const item: UserInventoryItem = {
      id: existing?.id ?? `inv_${userId}_${itemId}`,
      userId,
      itemId,
      quantity,
      assignedDigimonId,
    };
    this.inventory.set(key, item);
    return { ...item };
  }

  public static async executeFeedTransaction(params: {
    userId: string;
    digimonId: string;
    item: ItemDefinition;
    now?: Date;
  }): Promise<FeedResult> {
    const { userId, digimonId, item, now = new Date() } = params;

    const digimon = await this.findDigimonById(digimonId);
    if (!digimon) {
      throw new AppError('El Digimon especificado no existe', 404);
    }

    if (digimon.userId !== userId) {
      throw new AppError(
        'No tienes permiso para interactuar con este Digimon',
        403
      );
    }

    const inventoryKey = this.getInventoryKey(userId, item.id);
    const inventoryItem = this.inventory.get(inventoryKey);

    if (!inventoryItem || inventoryItem.quantity <= 0) {
      throw new AppError(
        'No dispones de unidades suficientes de este objeto en el inventario',
        400
      );
    }

    const decayResult = RaisingCalculator.calculateDecay(digimon, now);
    const newHunger = Math.max(0, decayResult.hunger - item.hungerRestore);
    const newFriendship = Math.min(100, digimon.friendship + item.friendshipGain);
    const newFatigue = decayResult.fatigue;

    inventoryItem.quantity -= 1;
    this.inventory.set(inventoryKey, { ...inventoryItem });

    const updatedDigimon: PlayerDigimon = {
      ...digimon,
      hunger: newHunger,
      fatigue: newFatigue,
      friendship: newFriendship,
      lastCalculatedAt: now,
    };
    this.digimons.set(digimonId, { ...updatedDigimon });

    return {
      digimon: { ...updatedDigimon },
      consumedItem: {
        id: item.id,
        name: item.name,
        hungerRestore: item.hungerRestore,
        friendshipGain: item.friendshipGain,
      },
      remainingQuantity: inventoryItem.quantity,
    };
  }

  public static async executeTrainTransaction(params: {
    userId: string;
    digimonId: string;
    stat: TrainableStat;
    newTotal?: number;
    bonus?: number;
    now?: Date;
  }): Promise<TrainResult> {
    const { userId, digimonId, stat, newTotal, bonus, now = new Date() } = params;

    const digimon = await this.findDigimonById(digimonId);
    if (!digimon) {
      throw new AppError('El Digimon especificado no existe', 404);
    }

    if (digimon.userId !== userId) {
      throw new AppError(
        'No tienes permiso para entrenar a este Digimon',
        403
      );
    }

    const decay = RaisingCalculator.calculateDecay(digimon, now);

    if (decay.fatigue >= RAISING_BALANCE.EXHAUSTION_THRESHOLD) {
      throw new AppError(
        'El Digimon está agotado. Necesita descansar antes de entrenar.',
        400
      );
    }

    if (decay.hunger >= RAISING_BALANCE.STARVATION_THRESHOLD) {
      throw new AppError(
        'El Digimon está famélico. Necesita ser alimentado antes de entrenar.',
        400
      );
    }

    const { baseKey, npKey, bonusKey } = this.getStatKeys(stat);
    const baseVal = digimon[baseKey] as number;
    const npVal = digimon[npKey] as number;
    const previousBonus = digimon[bonusKey] as number;

    const previousTotal = RaisingCalculator.calculateStatTotal(
      digimon.level,
      baseVal,
      npVal,
      previousBonus
    );

    let calculatedBonus: number;
    if (newTotal !== undefined) {
      calculatedBonus = RaisingCalculator.calculateBonusFromTotal(
        digimon.level,
        baseVal,
        npVal,
        newTotal
      );
    } else if (bonus !== undefined) {
      calculatedBonus = Math.max(0, bonus);
    } else {
      calculatedBonus = previousBonus + 10;
    }

    const calculatedTotal = RaisingCalculator.calculateStatTotal(
      digimon.level,
      baseVal,
      npVal,
      calculatedBonus
    );

    const newFatigue = Math.min(
      RAISING_BALANCE.MAX_STAT,
      decay.fatigue + RAISING_BALANCE.TRAINING_FATIGUE_INCREASE
    );

    const newHunger = Math.min(
      RAISING_BALANCE.MAX_STAT,
      decay.hunger + RAISING_BALANCE.TRAINING_HUNGER_INCREASE
    );

    const updatedDigimon: PlayerDigimon = {
      ...digimon,
      [bonusKey]: calculatedBonus,
      fatigue: newFatigue,
      hunger: newHunger,
      lastCalculatedAt: now,
    };

    this.digimons.set(digimonId, { ...updatedDigimon });

    return {
      digimon: { ...updatedDigimon },
      trainedStat: stat,
      previousBonus,
      newBonus: calculatedBonus,
      previousTotal,
      newTotal: calculatedTotal,
      totalStats: calculateTotalStats(updatedDigimon),
      fatigueGained: newFatigue - decay.fatigue,
      hungerGained: newHunger - decay.hunger,
    };
  }

  public static async executeRestTransaction(params: {
    userId: string;
    digimonId: string;
    now?: Date;
  }): Promise<RestResult> {
    const { userId, digimonId, now = new Date() } = params;

    const digimon = await this.findDigimonById(digimonId);
    if (!digimon) {
      throw new AppError('El Digimon especificado no existe', 404);
    }

    if (digimon.userId !== userId) {
      throw new AppError(
        'No tienes permiso para interactuar con este Digimon',
        403
      );
    }

    const decay = RaisingCalculator.calculateDecay(digimon, now);
    const newFatigue = Math.max(
      RAISING_BALANCE.MIN_STAT,
      decay.fatigue - RAISING_BALANCE.REST_FATIGUE_REDUCTION
    );
    const recovered = decay.fatigue - newFatigue;

    const updatedDigimon: PlayerDigimon = {
      ...digimon,
      fatigue: newFatigue,
      hunger: decay.hunger,
      lastCalculatedAt: now,
    };

    this.digimons.set(digimonId, { ...updatedDigimon });

    return {
      digimon: { ...updatedDigimon },
      recoveredFatigue: recovered,
      currentFatigue: newFatigue,
      totalStats: calculateTotalStats(updatedDigimon),
    };
  }

  public static clear(): void {
    this.digimons.clear();
    this.inventory.clear();
  }
}
