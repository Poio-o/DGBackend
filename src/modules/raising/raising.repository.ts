import { AppError } from '../../utils/errors';
import { RaisingCalculator } from './raisingCalculator';
import type { ItemDefinition } from './items.catalog';
import type {
  FeedResult,
  PlayerDigimon,
  UserInventoryItem,
} from './raising.types';

export class RaisingRepository {
  private static digimons = new Map<string, PlayerDigimon>();
  private static inventory = new Map<string, UserInventoryItem>();

  private static getInventoryKey(userId: string, itemId: string): string {
    return `${userId}:${itemId}`;
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

  public static clear(): void {
    this.digimons.clear();
    this.inventory.clear();
  }
}
