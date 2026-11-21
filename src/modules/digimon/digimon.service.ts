import { AppError } from '../../utils/errors';
import { DigimonRepository, type UserDigimonWithSpecies } from './digimon.repository';
import { calculateTotalStats } from '../raising/raising.types';
import type { UpdateNicknameResponse, UserDigimonSummary } from './digimon.types';

export class DigimonService {
  private static calculateMaxExp(level: number): number {
    return level * 100;
  }

  private static toUserDigimonSummary(
    d: UserDigimonWithSpecies
  ): UserDigimonSummary {
    const totalStats = calculateTotalStats(d);

    return {
      id: d.digimonId,
      userId: d.userId,
      speciesId: d.speciesId,
      nickname: d.nickname,
      level: d.level,
      currentExp: d.currentExp,
      maxExp: DigimonService.calculateMaxExp(d.level),
      friendship: d.friendship,
      hunger: d.hunger,
      fatigue: d.fatigue,
      isWalking: d.isWalking,

      speciesName: d.species.name,
      generation: d.species.generation,
      attribute: d.species.attribute,
      type: d.species.type,
      spriteUrl: d.species.spriteUrl,
      fullImageUrl: d.species.fullImageUrl || d.species.spriteUrl,
      description: d.species.description || '',

      baseHp: d.baseHp,
      baseSp: d.baseSp,
      baseAtk: d.baseAtk,
      baseDef: d.baseDef,
      baseInt: d.baseInt,
      baseSpi: d.baseSpi,
      baseSpd: d.baseSpd,

      npHp: d.npHp,
      npSp: d.npSp,
      npAtk: d.npAtk,
      npDef: d.npDef,
      npInt: d.npInt,
      npSpi: d.npSpi,
      npSpd: d.npSpd,

      bonusHp: d.bonusHp,
      bonusSp: d.bonusSp,
      bonusAtk: d.bonusAtk,
      bonusDef: d.bonusDef,
      bonusInt: d.bonusInt,
      bonusSpi: d.bonusSpi,
      bonusSpd: d.bonusSpd,

      totalStats,
    };
  }

  public static async getMyDigimons(
    userId: string
  ): Promise<UserDigimonSummary[]> {
    const digimons = await DigimonRepository.findManyByUserId(userId);
    return digimons.map(DigimonService.toUserDigimonSummary);
  }

  public static async updateNickname(
    userId: string,
    digimonId: string,
    rawNickname: string
  ): Promise<UpdateNicknameResponse> {
    const trimmed = rawNickname?.trim();
    if (!trimmed || trimmed.length === 0) {
      throw new AppError('El mote no puede estar vacío', 400);
    }
    if (trimmed.length > 50) {
      throw new AppError('El mote no puede exceder los 50 caracteres', 400);
    }

    const existing = await DigimonRepository.findById(digimonId);
    if (!existing) {
      throw new AppError('Digimon no encontrado', 404);
    }

    if (existing.userId !== userId) {
      throw new AppError('No tienes permiso para modificar este Digimon', 403);
    }

    const updated = await DigimonRepository.updateNickname(digimonId, trimmed);
    return {
      id: updated.digimonId,
      nickname: updated.nickname,
    };
  }
}
