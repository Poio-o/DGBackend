import { prisma } from '../../config/db';
import type { Prisma } from '@prisma/client';

export type UserDigimonWithSpecies = Prisma.UserDigimonGetPayload<{
  include: { species: true };
}>;

export class DigimonRepository {
  public static async findManyByUserId(
    userId: string
  ): Promise<UserDigimonWithSpecies[]> {
    return prisma.userDigimon.findMany({
      where: { userId },
      include: { species: true },
    });
  }

  public static async findById(digimonId: string) {
    return prisma.userDigimon.findUnique({
      where: { digimonId },
      include: { species: true },
    });
  }

  public static async updateNickname(
    digimonId: string,
    nickname: string
  ) {
    return prisma.userDigimon.update({
      where: { digimonId },
      data: { nickname },
    });
  }
}
