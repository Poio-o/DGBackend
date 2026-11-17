import { AppError } from '../../utils/errors';
import { findItemById } from './items.catalog';
import { RaisingCalculator } from './raisingCalculator';
import { RaisingRepository } from './raising.repository';
import {
  calculateTotalStats,
  type DigimonCareState,
  type DigimonTotalStats,
  type FeedResult,
  type PlayerDigimon,
  type RaisingBalanceConfig,
  type RestResult,
  type TemporalCalculationResult,
  type TrainRequestDto,
  type TrainResult,
  type TrainableStat,
} from './raising.types';

export class RaisingService {
  private static readonly VALID_STATS: readonly TrainableStat[] = [
    'HP',
    'SP',
    'ATK',
    'DEF',
    'INT',
    'SPI',
    'SPD',
  ];

  public static processTemporalDecay(
    state: DigimonCareState,
    currentTime: Date = new Date(),
    config?: Partial<RaisingBalanceConfig>
  ): TemporalCalculationResult {
    return RaisingCalculator.calculateDecay(state, currentTime, config);
  }

  public static checkTrainingEligibility(
    fatigue: number,
    hunger: number
  ): { canTrain: boolean; reason?: string } {
    if (fatigue >= 100) {
      return {
        canTrain: false,
        reason: 'El Digimon está agotado. Necesita descansar.',
      };
    }

    if (hunger >= 100) {
      return {
        canTrain: false,
        reason: 'El Digimon está famélico. Necesita ser alimentado.',
      };
    }

    return { canTrain: true };
  }

  public static async feedDigimon(
    userId: string,
    digimonId: string,
    itemId: string,
    now: Date = new Date()
  ): Promise<FeedResult> {
    if (!itemId || typeof itemId !== 'string' || itemId.trim() === '') {
      throw new AppError(
        'El identificador del objeto (itemId) es obligatorio',
        400
      );
    }

    if (!digimonId || typeof digimonId !== 'string' || digimonId.trim() === '') {
      throw new AppError('El identificador del Digimon es obligatorio', 400);
    }

    const item = findItemById(itemId.trim());
    if (!item) {
      throw new AppError(
        'El objeto seleccionado no existe en el catálogo',
        404
      );
    }

    if (item.category !== 'FOOD') {
      throw new AppError(
        'El objeto seleccionado no es un alimento comestible',
        400
      );
    }

    return RaisingRepository.executeFeedTransaction({
      userId,
      digimonId: digimonId.trim(),
      item,
      now,
    });
  }

  public static async trainDigimon(
    userId: string,
    digimonId: string,
    dto: TrainRequestDto,
    now: Date = new Date()
  ): Promise<TrainResult> {
    if (!digimonId || typeof digimonId !== 'string' || digimonId.trim() === '') {
      throw new AppError('El identificador del Digimon es obligatorio', 400);
    }

    if (!dto || !dto.stat || !this.VALID_STATS.includes(dto.stat)) {
      throw new AppError(
        'Atributo de entrenamiento no válido. Debe ser: HP, SP, ATK, DEF, INT, SPI o SPD',
        400
      );
    }

    if (
      dto.newTotal !== undefined &&
      (typeof dto.newTotal !== 'number' || isNaN(dto.newTotal) || dto.newTotal < 0)
    ) {
      throw new AppError('El valor de newTotal debe ser un número positivo', 400);
    }

    if (
      dto.bonus !== undefined &&
      (typeof dto.bonus !== 'number' || isNaN(dto.bonus) || dto.bonus < 0)
    ) {
      throw new AppError('El valor de bonus debe ser un número positivo', 400);
    }

    return RaisingRepository.executeTrainTransaction({
      userId,
      digimonId: digimonId.trim(),
      stat: dto.stat,
      newTotal: dto.newTotal,
      bonus: dto.bonus,
      now,
    });
  }

  public static async restDigimon(
    userId: string,
    digimonId: string,
    now: Date = new Date()
  ): Promise<RestResult> {
    if (!digimonId || typeof digimonId !== 'string' || digimonId.trim() === '') {
      throw new AppError('El identificador del Digimon es obligatorio', 400);
    }

    return RaisingRepository.executeRestTransaction({
      userId,
      digimonId: digimonId.trim(),
      now,
    });
  }

  public static async getDigimonStatus(
    userId: string,
    digimonId: string,
    now: Date = new Date()
  ): Promise<{
    digimon: PlayerDigimon;
    decay: TemporalCalculationResult;
    totalStats: DigimonTotalStats;
  }> {
    const digimon = await RaisingRepository.findDigimonById(digimonId);
    if (!digimon) {
      throw new AppError('El Digimon especificado no existe', 404);
    }

    if (digimon.userId !== userId) {
      throw new AppError(
        'No tienes permiso para consultar este Digimon',
        403
      );
    }

    const decay = RaisingCalculator.calculateDecay(digimon, now);
    const updatedDigimon = {
      ...digimon,
      hunger: decay.hunger,
      fatigue: decay.fatigue,
    };

    return {
      digimon: updatedDigimon,
      decay,
      totalStats: calculateTotalStats(updatedDigimon),
    };
  }
}
