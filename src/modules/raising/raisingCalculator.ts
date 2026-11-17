import {
  RAISING_BALANCE,
  type DigimonCareState,
  type RaisingBalanceConfig,
  type TemporalCalculationResult,
} from './raising.types';

export class RaisingCalculator {
  private static readonly DEFAULT_CONFIG: RaisingBalanceConfig = {
    hungerPerHour: RAISING_BALANCE.HUNGER_INCREASE_PER_HOUR,
    fatigueRecoveryPerHour: RAISING_BALANCE.FATIGUE_RECOVERY_PER_HOUR,
    minStat: RAISING_BALANCE.MIN_STAT,
    maxStat: RAISING_BALANCE.MAX_STAT,
  };

  public static clamp(val: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, val));
  }

  public static calculateDecay(
    state: DigimonCareState,
    targetTime: Date = new Date(),
    customConfig?: Partial<RaisingBalanceConfig>
  ): TemporalCalculationResult {
    const config: RaisingBalanceConfig = {
      ...this.DEFAULT_CONFIG,
      ...customConfig,
    };

    const lastTimeMs = new Date(state.lastCalculatedAt).getTime();
    const targetTimeMs = targetTime.getTime();

    const elapsedMs = Math.max(0, targetTimeMs - lastTimeMs);
    const elapsedSeconds = Math.floor(elapsedMs / 1000);
    const elapsedHours = elapsedMs / (1000 * 60 * 60);

    const hungerIncrease = Math.round(elapsedHours * config.hungerPerHour);
    const fatigueDecrease = Math.round(
      elapsedHours * config.fatigueRecoveryPerHour
    );

    const newHunger = this.clamp(
      state.hunger + hungerIncrease,
      config.minStat,
      config.maxStat
    );

    const newFatigue = this.clamp(
      state.fatigue - fatigueDecrease,
      config.minStat,
      config.maxStat
    );

    const hungerDelta = newHunger - state.hunger;
    const fatigueDelta = newFatigue - state.fatigue;

    return {
      hunger: newHunger,
      fatigue: newFatigue,
      lastCalculatedAt: targetTime,
      elapsedSeconds,
      elapsedHours: Number(elapsedHours.toFixed(4)),
      hungerDelta,
      fatigueDelta,
      isStarving: newHunger >= config.maxStat,
      isExhausted: newFatigue >= config.maxStat,
    };
  }

  public static canTrain(fatigue: number, hunger: number): boolean {
    return (
      fatigue < RAISING_BALANCE.EXHAUSTION_THRESHOLD &&
      hunger < RAISING_BALANCE.STARVATION_THRESHOLD
    );
  }

  public static calculateStatTotal(
    level: number,
    baseStat: number,
    npStat: number,
    bonusStat: number
  ): number {
    return level * (baseStat + npStat) + bonusStat;
  }

  public static calculateBonusFromTotal(
    level: number,
    baseStat: number,
    npStat: number,
    targetTotal: number
  ): number {
    const baseSum = level * (baseStat + npStat);
    return Math.max(0, targetTotal - baseSum);
  }
}
