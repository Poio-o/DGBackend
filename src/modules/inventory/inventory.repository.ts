import { prisma } from '../../config/db';
import type { Prisma } from '@prisma/client';

export type UserInventoryWithItem = Prisma.UserInventoryGetPayload<{
  include: { item: true };
}>;

export class InventoryRepository {
  public static async findManyByUserId(
    userId: string
  ): Promise<UserInventoryWithItem[]> {
    return prisma.userInventory.findMany({
      where: { userId },
      include: { item: true },
    });
  }
}
