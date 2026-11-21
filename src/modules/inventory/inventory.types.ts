export interface UserInventoryItemResponse {
  id: string;
  itemId: string;
  name: string;
  category: string;
  description: string;
  iconUrl: string;
  quantity: number;
  isStackable: boolean;
  maxStack: number;
  hungerRestore: number;
  friendshipGain: number;
}
