import { InventoryRepository, type UserInventoryWithItem } from './inventory.repository';
import type { UserInventoryItemResponse } from './inventory.types';

export class InventoryService {
  private static toInventoryItemResponse(
    entry: UserInventoryWithItem
  ): UserInventoryItemResponse {
    return {
      id: String(entry.id),
      itemId: entry.itemId,
      name: entry.item.name,
      category: entry.item.category,
      description: entry.item.description,
      iconUrl: entry.item.iconUrl,
      quantity: entry.quantity,
      isStackable: entry.item.isStackable,
      maxStack: entry.item.maxStack,
      hungerRestore: entry.item.hungerRestored,
      friendshipGain: entry.item.friendshipGain,
    };
  }

  public static async getMyInventory(
    userId: string
  ): Promise<UserInventoryItemResponse[]> {
    const items = await InventoryRepository.findManyByUserId(userId);
    return items.map(InventoryService.toInventoryItemResponse);
  }
}
