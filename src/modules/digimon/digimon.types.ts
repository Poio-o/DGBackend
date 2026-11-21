import type { DigimonTotalStats } from '../raising/raising.types';

export interface UserDigimonSummary {
  id: string;
  userId: string;
  speciesId: string;
  nickname: string;
  level: number;
  currentExp: number;
  maxExp: number;
  friendship: number;
  hunger: number;
  fatigue: number;
  isWalking: boolean;

  speciesName: string;
  generation: string;
  attribute: string;
  type: string;
  spriteUrl: string;
  fullImageUrl: string;
  description: string;

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

  totalStats?: DigimonTotalStats;
}

export interface UpdateNicknameDto {
  nickname: string;
}

export interface UpdateNicknameResponse {
  id: string;
  nickname: string;
}
