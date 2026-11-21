export const RAISING_BALANCE = {
  MIN_STAT: 0,
  MAX_STAT: 100,
  HUNGER_INCREASE_PER_HOUR: 10,
  FATIGUE_RECOVERY_PER_HOUR: 15,
  STARVATION_THRESHOLD: 100,
  EXHAUSTION_THRESHOLD: 100,
  TRAINING_FATIGUE_INCREASE: 20,
  TRAINING_HUNGER_INCREASE: 10,
  REST_FATIGUE_REDUCTION: 40,
} as const;

export type TrainableStat =
  | 'HP'
  | 'SP'
  | 'ATK'
  | 'DEF'
  | 'INT'
  | 'SPI'
  | 'SPD';

export interface RaisingBalanceConfig {
  hungerPerHour: number;
  fatigueRecoveryPerHour: number;
  minStat: number;
  maxStat: number;
}

export interface DigimonCareState {
  hunger: number;
  fatigue: number;
  lastCalculatedAt: Date | string | number;
}

export interface TemporalCalculationResult {
  hunger: number;
  fatigue: number;
  lastCalculatedAt: Date;
  elapsedSeconds: number;
  elapsedHours: number;
  hungerDelta: number;
  fatigueDelta: number;
  isStarving: boolean;
  isExhausted: boolean;
}

export interface DigimonTotalStats {
  totalHp: number;
  totalSp: number;
  totalAtk: number;
  totalDef: number;
  totalInt: number;
  totalSpi: number;
  totalSpd: number;
}

export interface PlayerDigimon {
  id: string;
  userId: string;
  slotNumber: number | null;
  nickname: string;
  speciesName: string;
  generation: string;
  attribute: string;
  type: string;
  spriteUrl: string;
  level: number;
  currentExp: number;
  friendship: number;
  hunger: number;
  fatigue: number;

  baseHp: number;
  baseSp: number;
  baseAtk: number;
  baseDef: number;
  baseInt: number;
  baseSpi: number;
  baseSpd: number;

  npHp: number;
  npSp: number;
  npAtk: number;
  npDef: number;
  npInt: number;
  npSpi: number;
  npSpd: number;

  bonusHp: number;
  bonusSp: number;
  bonusAtk: number;
  bonusDef: number;
  bonusInt: number;
  bonusSpi: number;
  bonusSpd: number;

  stepsWalked: number;
  expGained: number;
  friendshipGained: number;
  isWalking: boolean;

  lastCalculatedAt: Date | string;
}

export type DigimonStatsInput = Pick<
  PlayerDigimon,
  | 'level'
  | 'baseHp'
  | 'baseSp'
  | 'baseAtk'
  | 'baseDef'
  | 'baseInt'
  | 'baseSpi'
  | 'baseSpd'
  | 'npHp'
  | 'npSp'
  | 'npAtk'
  | 'npDef'
  | 'npInt'
  | 'npSpi'
  | 'npSpd'
  | 'bonusHp'
  | 'bonusSp'
  | 'bonusAtk'
  | 'bonusDef'
  | 'bonusInt'
  | 'bonusSpi'
  | 'bonusSpd'
>;

export function calculateTotalStats(digimon: DigimonStatsInput): DigimonTotalStats {
  return {
    totalHp: digimon.level * (digimon.baseHp + digimon.npHp) + digimon.bonusHp,
    totalSp: digimon.level * (digimon.baseSp + digimon.npSp) + digimon.bonusSp,
    totalAtk: digimon.level * (digimon.baseAtk + digimon.npAtk) + digimon.bonusAtk,
    totalDef: digimon.level * (digimon.baseDef + digimon.npDef) + digimon.bonusDef,
    totalInt: digimon.level * (digimon.baseInt + digimon.npInt) + digimon.bonusInt,
    totalSpi: digimon.level * (digimon.baseSpi + digimon.npSpi) + digimon.bonusSpi,
    totalSpd: digimon.level * (digimon.baseSpd + digimon.npSpd) + digimon.bonusSpd,
  };
}

export interface UserInventoryItem {
  id: string;
  userId: string;
  itemId: string;
  quantity: number;
  assignedDigimonId?: string | null;
}

export interface FeedRequestDto {
  itemId: string;
}

export interface FeedResult {
  digimon: PlayerDigimon;
  consumedItem: {
    id: string;
    name: string;
    hungerRestore: number;
    friendshipGain: number;
  };
  remainingQuantity: number;
}

export interface TrainRequestDto {
  stat: TrainableStat;
  newTotal?: number;
  bonus?: number;
}

export interface TrainResult {
  digimon: PlayerDigimon;
  trainedStat: TrainableStat;
  previousBonus: number;
  newBonus: number;
  previousTotal: number;
  newTotal: number;
  totalStats: DigimonTotalStats;
  fatigueGained: number;
  hungerGained: number;
}

export interface RestResult {
  digimon: PlayerDigimon;
  recoveredFatigue: number;
  currentFatigue: number;
  totalStats: DigimonTotalStats;
}
