export const RAISING_BALANCE = {
  MIN_STAT: 0,
  MAX_STAT: 100,
  HUNGER_INCREASE_PER_HOUR: 10,
  FATIGUE_RECOVERY_PER_HOUR: 15,
  STARVATION_THRESHOLD: 100,
  EXHAUSTION_THRESHOLD: 100,
} as const;

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
