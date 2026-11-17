import { describe, it, beforeEach, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import app from '../../app';
import { env } from '../../config/env';
import { RaisingCalculator } from './raisingCalculator';
import { RaisingService } from './raising.service';
import { RaisingRepository } from './raising.repository';
import {
  RAISING_BALANCE,
  calculateTotalStats,
  type PlayerDigimon,
} from './raising.types';
import { AppError } from '../../utils/errors';

describe('Raising Temporal Decay Engine - US-07 / SUB-07-1', () => {
  it('mantiene el estado sin cambios si el tiempo transcurrido es 0', () => {
    const baseDate = new Date('2026-11-16T12:00:00Z');
    const state = {
      hunger: 30,
      fatigue: 40,
      lastCalculatedAt: baseDate,
    };

    const result = RaisingCalculator.calculateDecay(state, baseDate);

    assert.strictEqual(result.hunger, 30);
    assert.strictEqual(result.fatigue, 40);
    assert.strictEqual(result.hungerDelta, 0);
    assert.strictEqual(result.fatigueDelta, 0);
    assert.strictEqual(result.elapsedSeconds, 0);
    assert.strictEqual(result.isStarving, false);
    assert.strictEqual(result.isExhausted, false);
  });

  it('no produce valores negativos si la fecha destino es anterior a la ultima calculada', () => {
    const baseDate = new Date('2026-11-16T12:00:00Z');
    const earlierDate = new Date('2026-11-16T11:00:00Z');
    const state = {
      hunger: 20,
      fatigue: 50,
      lastCalculatedAt: baseDate,
    };

    const result = RaisingCalculator.calculateDecay(state, earlierDate);

    assert.strictEqual(result.hunger, 20);
    assert.strictEqual(result.fatigue, 50);
    assert.strictEqual(result.elapsedSeconds, 0);
    assert.strictEqual(result.hungerDelta, 0);
    assert.strictEqual(result.fatigueDelta, 0);
  });

  it('calcula la degradacion de 1 hora correctamente segun la tasa de balance', () => {
    const startTime = new Date('2026-11-16T10:00:00Z');
    const oneHourLater = new Date('2026-11-16T11:00:00Z');
    const state = {
      hunger: 10,
      fatigue: 50,
      lastCalculatedAt: startTime,
    };

    const result = RaisingCalculator.calculateDecay(state, oneHourLater);

    assert.strictEqual(
      result.hunger,
      10 + RAISING_BALANCE.HUNGER_INCREASE_PER_HOUR
    );
    assert.strictEqual(
      result.fatigue,
      50 - RAISING_BALANCE.FATIGUE_RECOVERY_PER_HOUR
    );
    assert.strictEqual(
      result.hungerDelta,
      RAISING_BALANCE.HUNGER_INCREASE_PER_HOUR
    );
    assert.strictEqual(
      result.fatigueDelta,
      -RAISING_BALANCE.FATIGUE_RECOVERY_PER_HOUR
    );
    assert.strictEqual(result.elapsedSeconds, 3600);
    assert.strictEqual(result.elapsedHours, 1);
  });

  it('aplica el tope superior de 100 para el hambre y activa isStarving', () => {
    const startTime = new Date('2026-11-16T00:00:00Z');
    const twentyHoursLater = new Date('2026-11-16T20:00:00Z');
    const state = {
      hunger: 80,
      fatigue: 0,
      lastCalculatedAt: startTime,
    };

    const result = RaisingCalculator.calculateDecay(state, twentyHoursLater);

    assert.strictEqual(result.hunger, 100);
    assert.strictEqual(result.isStarving, true);
    assert.strictEqual(result.hungerDelta, 20);
  });

  it('aplica el tope inferior de 0 para la fatiga y no permite valores negativos', () => {
    const startTime = new Date('2026-11-16T00:00:00Z');
    const tenHoursLater = new Date('2026-11-16T10:00:00Z');
    const state = {
      hunger: 0,
      fatigue: 30,
      lastCalculatedAt: startTime,
    };

    const result = RaisingCalculator.calculateDecay(state, tenHoursLater);

    assert.strictEqual(result.fatigue, 0);
    assert.strictEqual(result.fatigueDelta, -30);
  });

  it('detecta correctamente el estado de agotamiento extremo', () => {
    const state = {
      hunger: 10,
      fatigue: 100,
      lastCalculatedAt: new Date(),
    };

    const result = RaisingCalculator.calculateDecay(
      state,
      new Date(state.lastCalculatedAt.getTime())
    );

    assert.strictEqual(result.isExhausted, true);
  });

  it('evalua las condiciones de elegibilidad para entrenamiento', () => {
    assert.strictEqual(RaisingCalculator.canTrain(30, 40), true);
    assert.strictEqual(RaisingCalculator.canTrain(100, 40), false);
    assert.strictEqual(RaisingCalculator.canTrain(30, 100), false);
    assert.strictEqual(RaisingCalculator.canTrain(100, 100), false);

    const eligible = RaisingService.checkTrainingEligibility(20, 20);
    assert.strictEqual(eligible.canTrain, true);
    assert.strictEqual(eligible.reason, undefined);

    const exhausted = RaisingService.checkTrainingEligibility(100, 20);
    assert.strictEqual(exhausted.canTrain, false);
    assert.strictEqual(typeof exhausted.reason, 'string');

    const starving = RaisingService.checkTrainingEligibility(20, 100);
    assert.strictEqual(starving.canTrain, false);
    assert.strictEqual(typeof starving.reason, 'string');
  });

  it('ejecuta processTemporalDecay a traves de RaisingService correctamente', () => {
    const baseDate = new Date('2026-11-16T10:00:00Z');
    const targetDate = new Date('2026-11-16T12:00:00Z');
    const state = {
      hunger: 20,
      fatigue: 60,
      lastCalculatedAt: baseDate,
    };

    const result = RaisingService.processTemporalDecay(state, targetDate);
    assert.strictEqual(result.hunger, 40);
    assert.strictEqual(result.fatigue, 30);
    assert.strictEqual(result.elapsedHours, 2);
  });

  it('permite inyectar configuraciones de balance personalizadas', () => {
    const startTime = new Date('2026-11-16T00:00:00Z');
    const twoHoursLater = new Date('2026-11-16T02:00:00Z');
    const state = {
      hunger: 10,
      fatigue: 80,
      lastCalculatedAt: startTime,
    };

    const customConfig = {
      hungerPerHour: 25,
      fatigueRecoveryPerHour: 40,
    };

    const result = RaisingCalculator.calculateDecay(
      state,
      twoHoursLater,
      customConfig
    );

    assert.strictEqual(result.hunger, 60);
    assert.strictEqual(result.fatigue, 0);
    assert.strictEqual(result.hungerDelta, 50);
    assert.strictEqual(result.fatigueDelta, -80);
  });
});

describe('Raising Feeding & Inventory Engine - US-07 / SUB-07-2', () => {
  const userId = 'user_test_agumon';
  const digimonId = 'digi_test_agumon';

  const createSampleDigimon = (
    overrides?: Partial<PlayerDigimon>
  ): PlayerDigimon => ({
    id: digimonId,
    userId,
    slotNumber: null,
    nickname: 'Agumon',
    speciesName: 'Agumon',
    generation: 'Child',
    attribute: 'Vaccine',
    type: 'Reptile',
    spriteUrl: '/sprites/agumon.png',
    level: 5,
    currentExp: 120,
    friendship: 25,
    hunger: 50,
    fatigue: 30,

    baseHp: 100,
    baseSp: 40,
    baseAtk: 25,
    baseDef: 20,
    baseInt: 15,
    baseSpi: 18,
    baseSpd: 22,

    npHp: 10,
    npSp: 5,
    npAtk: 4,
    npDef: 3,
    npInt: 2,
    npSpi: 2,
    npSpd: 3,

    bonusHp: 0,
    bonusSp: 0,
    bonusAtk: 0,
    bonusDef: 0,
    bonusInt: 0,
    bonusSpi: 0,
    bonusSpd: 0,

    stepsWalked: 0,
    expGained: 0,
    friendshipGained: 0,
    isWalking: false,

    lastCalculatedAt: new Date('2026-11-17T12:00:00Z'),
    ...overrides,
  });

  beforeEach(() => {
    RaisingRepository.clear();
  });

  it('alimenta al Digimon reduciendo el hambre y aumentando la amistad consumiendo 1 item', async () => {
    const fixedNow = new Date('2026-11-17T12:00:00Z');
    await RaisingRepository.saveDigimon(
      createSampleDigimon({ hunger: 50, friendship: 25, lastCalculatedAt: fixedNow })
    );
    await RaisingRepository.setUserInventoryItem(userId, 'meat_common', 3);

    const result = await RaisingService.feedDigimon(
      userId,
      digimonId,
      'meat_common',
      fixedNow
    );

    assert.strictEqual(result.digimon.hunger, 25);
    assert.strictEqual(result.digimon.friendship, 26);
    assert.strictEqual(result.remainingQuantity, 2);
    assert.strictEqual(result.consumedItem.id, 'meat_common');
    assert.strictEqual(result.consumedItem.hungerRestore, 25);
    assert.strictEqual(result.consumedItem.friendshipGain, 1);

    const storedInventory = await RaisingRepository.getUserInventoryItem(
      userId,
      'meat_common'
    );
    assert.strictEqual(storedInventory?.quantity, 2);
  });

  it('acota el hambre a 0 y no permite valores negativos al alimentar en exceso', async () => {
    const fixedNow = new Date('2026-11-17T12:00:00Z');
    await RaisingRepository.saveDigimon(
      createSampleDigimon({ hunger: 10, friendship: 50, lastCalculatedAt: fixedNow })
    );
    await RaisingRepository.setUserInventoryItem(userId, 'sirloin', 1);

    const result = await RaisingService.feedDigimon(
      userId,
      digimonId,
      'sirloin',
      fixedNow
    );

    assert.strictEqual(result.digimon.hunger, 0);
    assert.strictEqual(result.digimon.friendship, 55);
    assert.strictEqual(result.remainingQuantity, 0);
  });

  it('acota la amistad a 100 como maximo', async () => {
    const fixedNow = new Date('2026-11-17T12:00:00Z');
    await RaisingRepository.saveDigimon(
      createSampleDigimon({ hunger: 40, friendship: 98, lastCalculatedAt: fixedNow })
    );
    await RaisingRepository.setUserInventoryItem(userId, 'sirloin', 1);

    const result = await RaisingService.feedDigimon(
      userId,
      digimonId,
      'sirloin',
      fixedNow
    );

    assert.strictEqual(result.digimon.friendship, 100);
  });

  it('aplica la degradacion temporal transcurrida antes de descontar el alimento', async () => {
    const baseTime = new Date('2026-11-17T10:00:00Z');
    const feedTime = new Date('2026-11-17T12:00:00Z');

    await RaisingRepository.saveDigimon(
      createSampleDigimon({
        hunger: 30,
        fatigue: 40,
        friendship: 10,
        lastCalculatedAt: baseTime,
      })
    );
    await RaisingRepository.setUserInventoryItem(userId, 'meat_giant', 2);

    const result = await RaisingService.feedDigimon(
      userId,
      digimonId,
      'meat_giant',
      feedTime
    );

    assert.strictEqual(result.digimon.hunger, 0);
    assert.strictEqual(result.digimon.fatigue, 10);
    assert.strictEqual(result.digimon.friendship, 12);
    assert.strictEqual(result.remainingQuantity, 1);
  });

  it('rechaza si el identificador del objeto no se especifica o esta vacio', async () => {
    await assert.rejects(
      async () => {
        await RaisingService.feedDigimon(userId, digimonId, '');
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 400);
        return true;
      }
    );
  });

  it('rechaza si el objeto no existe en el catalogo', async () => {
    await assert.rejects(
      async () => {
        await RaisingService.feedDigimon(userId, digimonId, 'non_existent_item');
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 404);
        return true;
      }
    );
  });

  it('rechaza si el Digimon especificado no existe', async () => {
    await assert.rejects(
      async () => {
        await RaisingService.feedDigimon(userId, 'unknown_digimon', 'meat_common');
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 404);
        return true;
      }
    );
  });

  it('rechaza con 403 si el Digimon pertenece a otro usuario', async () => {
    await RaisingRepository.saveDigimon(
      createSampleDigimon({ userId: 'other_user_999' })
    );

    await assert.rejects(
      async () => {
        await RaisingService.feedDigimon(userId, digimonId, 'meat_common');
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 403);
        return true;
      }
    );
  });

  it('rechaza si el usuario no tiene unidades en el inventario', async () => {
    await RaisingRepository.saveDigimon(createSampleDigimon());
    await RaisingRepository.setUserInventoryItem(userId, 'meat_common', 0);

    await assert.rejects(
      async () => {
        await RaisingService.feedDigimon(userId, digimonId, 'meat_common');
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 400);
        return true;
      }
    );
  });
});

describe('Raising Training & Resting Engine - US-07 / SUB-07-3', () => {
  const userId = 'user_trainer_tai';
  const digimonId = 'digi_wargreymon';

  const createSampleTrainedDigimon = (
    overrides?: Partial<PlayerDigimon>
  ): PlayerDigimon => ({
    id: digimonId,
    userId,
    slotNumber: 1,
    nickname: 'WarGreymon',
    speciesName: 'WarGreymon',
    generation: 'Ultimate',
    attribute: 'Vaccine',
    type: 'Dragon Man',
    spriteUrl: '/sprites/wargreymon.png',
    level: 50,
    currentExp: 10000,
    friendship: 90,
    hunger: 20,
    fatigue: 10,

    baseHp: 500,
    baseSp: 200,
    baseAtk: 180,
    baseDef: 150,
    baseInt: 110,
    baseSpi: 120,
    baseSpd: 140,

    npHp: 25,
    npSp: 20,
    npAtk: 22,
    npDef: 18,
    npInt: 15,
    npSpi: 16,
    npSpd: 19,

    bonusHp: 0,
    bonusSp: 0,
    bonusAtk: 50,
    bonusDef: 0,
    bonusInt: 0,
    bonusSpi: 0,
    bonusSpd: 0,

    stepsWalked: 15000,
    expGained: 5000,
    friendshipGained: 40,
    isWalking: false,

    lastCalculatedAt: new Date('2026-11-18T12:00:00Z'),
    ...overrides,
  });

  beforeEach(() => {
    RaisingRepository.clear();
  });

  it('calcula la formula de estadistica total segun level * (base + np) + bonus', () => {
    const level = 10;
    const baseAtk = 40;
    const npAtk = 10;
    const bonusAtk = 200;

    const total = RaisingCalculator.calculateStatTotal(level, baseAtk, npAtk, bonusAtk);
    assert.strictEqual(total, 10 * (40 + 10) + 200);
    assert.strictEqual(total, 700);

    const bonusForTarget = RaisingCalculator.calculateBonusFromTotal(level, baseAtk, npAtk, 850);
    assert.strictEqual(bonusForTarget, 850 - 10 * (40 + 10));
    assert.strictEqual(bonusForTarget, 350);
  });

  it('entrena un stat reemplazando el valor anterior segun la formula sin sumarlo', async () => {
    const fixedNow = new Date('2026-11-18T12:00:00Z');
    const digimon = createSampleTrainedDigimon({ lastCalculatedAt: fixedNow });
    await RaisingRepository.saveDigimon(digimon);

    const baseSum = 50 * (180 + 22);
    assert.strictEqual(baseSum, 10100);

    const result1 = await RaisingService.trainDigimon(
      userId,
      digimonId,
      { stat: 'ATK', newTotal: 10500 },
      fixedNow
    );

    assert.strictEqual(result1.trainedStat, 'ATK');
    assert.strictEqual(result1.newTotal, 10500);
    assert.strictEqual(result1.newBonus, 400);
    assert.strictEqual(result1.totalStats.totalAtk, 10500);
    assert.strictEqual(result1.digimon.fatigue, 30);
    assert.strictEqual(result1.digimon.hunger, 30);

    const result2 = await RaisingService.trainDigimon(
      userId,
      digimonId,
      { stat: 'ATK', newTotal: 10600 },
      fixedNow
    );

    assert.strictEqual(result2.newTotal, 10600);
    assert.strictEqual(result2.newBonus, 500);
    assert.notStrictEqual(result2.newTotal, 10500 + 10600);
    assert.strictEqual(result2.totalStats.totalAtk, 10600);
    assert.strictEqual(result2.digimon.fatigue, 50);
    assert.strictEqual(result2.digimon.hunger, 40);
  });

  it('reemplaza el bono directamente cuando se pasa el campo bonus', async () => {
    const fixedNow = new Date('2026-11-18T12:00:00Z');
    await RaisingRepository.saveDigimon(
      createSampleTrainedDigimon({ bonusSpd: 20, lastCalculatedAt: fixedNow })
    );

    const result = await RaisingService.trainDigimon(
      userId,
      digimonId,
      { stat: 'SPD', bonus: 85 },
      fixedNow
    );

    assert.strictEqual(result.previousBonus, 20);
    assert.strictEqual(result.newBonus, 85);
    assert.strictEqual(result.digimon.bonusSpd, 85);
  });

  it('bloquea el entrenamiento con 400 si la fatiga es 100', async () => {
    const fixedNow = new Date('2026-11-18T12:00:00Z');
    await RaisingRepository.saveDigimon(
      createSampleTrainedDigimon({ fatigue: 100, lastCalculatedAt: fixedNow })
    );

    await assert.rejects(
      async () => {
        await RaisingService.trainDigimon(
          userId,
          digimonId,
          { stat: 'ATK', bonus: 50 },
          fixedNow
        );
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(
          err.message,
          'El Digimon está agotado. Necesita descansar antes de entrenar.'
        );
        return true;
      }
    );
  });

  it('bloquea el entrenamiento con 400 si el hambre es 100', async () => {
    const fixedNow = new Date('2026-11-18T12:00:00Z');
    await RaisingRepository.saveDigimon(
      createSampleTrainedDigimon({ hunger: 100, fatigue: 0, lastCalculatedAt: fixedNow })
    );

    await assert.rejects(
      async () => {
        await RaisingService.trainDigimon(
          userId,
          digimonId,
          { stat: 'DEF', bonus: 30 },
          fixedNow
        );
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(
          err.message,
          'El Digimon está famélico. Necesita ser alimentado antes de entrenar.'
        );
        return true;
      }
    );
  });

  it('aplica la degradacion temporal antes de validar si el Digimon puede entrenar', async () => {
    const baseTime = new Date('2026-11-18T00:00:00Z');
    const tenHoursLater = new Date('2026-11-18T10:00:00Z');

    await RaisingRepository.saveDigimon(
      createSampleTrainedDigimon({ hunger: 5, lastCalculatedAt: baseTime })
    );

    await assert.rejects(
      async () => {
        await RaisingService.trainDigimon(
          userId,
          digimonId,
          { stat: 'ATK', bonus: 20 },
          tenHoursLater
        );
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 400);
        return true;
      }
    );
  });

  it('permite descansar con restDigimon recuperando 40 puntos de fatiga', async () => {
    const fixedNow = new Date('2026-11-18T12:00:00Z');
    await RaisingRepository.saveDigimon(
      createSampleTrainedDigimon({ fatigue: 70, lastCalculatedAt: fixedNow })
    );

    const result = await RaisingService.restDigimon(userId, digimonId, fixedNow);

    assert.strictEqual(result.recoveredFatigue, 40);
    assert.strictEqual(result.currentFatigue, 30);
    assert.strictEqual(result.digimon.fatigue, 30);
  });

  it('un Digimon agotado a 100 puede entrenar de nuevo tras descansar', async () => {
    const fixedNow = new Date('2026-11-18T12:00:00Z');
    await RaisingRepository.saveDigimon(
      createSampleTrainedDigimon({ fatigue: 100, hunger: 20, lastCalculatedAt: fixedNow })
    );

    const restRes = await RaisingService.restDigimon(userId, digimonId, fixedNow);
    assert.strictEqual(restRes.currentFatigue, 60);

    const trainRes = await RaisingService.trainDigimon(
      userId,
      digimonId,
      { stat: 'INT', bonus: 40 },
      fixedNow
    );

    assert.strictEqual(trainRes.digimon.fatigue, 80);
    assert.strictEqual(trainRes.newBonus, 40);
  });

  it('rechaza con 400 si el atributo a entrenar no es valido', async () => {
    await assert.rejects(
      async () => {
        await RaisingService.trainDigimon(userId, digimonId, { stat: 'INVALID' as any });
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 400);
        return true;
      }
    );
  });
});

describe('Raising Endpoints HTTP Integration - Full Life Cycle & Training', () => {
  let server: http.Server;
  let baseUrl: string;

  const testUser = {
    sub: 'user_jwt_integration',
    username: 'HikariYagami',
    email: 'hikari@digiworld.com',
  };

  const authToken = jwt.sign(testUser, env.JWT_SECRET, { expiresIn: '1h' });
  const digimonId = 'digi_gatomon_01';

  beforeEach(() => {
    RaisingRepository.clear();
  });

  after(() => {
    if (server) {
      server.close();
    }
  });

  it('arranca el servidor y procesa endpoints protegidos por authMiddleware', async () => {
    server = app.listen(0);
    const address = server.address() as any;
    baseUrl = `http://127.0.0.1:${address.port}`;

    await RaisingRepository.saveDigimon({
      id: digimonId,
      userId: testUser.sub,
      slotNumber: null,
      nickname: 'Gatomon',
      speciesName: 'Tailmon',
      generation: 'Adult',
      attribute: 'Vaccine',
      type: 'Holy Beast',
      spriteUrl: '/sprites/gatomon.png',
      level: 12,
      currentExp: 450,
      friendship: 60,
      hunger: 45,
      fatigue: 20,

      baseHp: 180,
      baseSp: 70,
      baseAtk: 45,
      baseDef: 40,
      baseInt: 35,
      baseSpi: 42,
      baseSpd: 50,

      npHp: 15,
      npSp: 8,
      npAtk: 6,
      npDef: 6,
      npInt: 5,
      npSpi: 5,
      npSpd: 7,

      bonusHp: 0,
      bonusSp: 0,
      bonusAtk: 0,
      bonusDef: 0,
      bonusInt: 0,
      bonusSpi: 0,
      bonusSpd: 0,

      stepsWalked: 0,
      expGained: 0,
      friendshipGained: 0,
      isWalking: false,

      lastCalculatedAt: new Date(),
    });

    await RaisingRepository.setUserInventoryItem(testUser.sub, 'meat_common', 5);

    const unauthRes = await fetch(`${baseUrl}/api/v1/digimons/${digimonId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: 'meat_common' }),
    });
    assert.strictEqual(unauthRes.status, 401);

    const badReqRes = await fetch(`${baseUrl}/api/v1/digimons/${digimonId}/feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({}),
    });
    assert.strictEqual(badReqRes.status, 400);

    const successRes = await fetch(`${baseUrl}/api/v1/digimons/${digimonId}/feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ itemId: 'meat_common' }),
    });

    assert.strictEqual(successRes.status, 200);
    const successJson = (await successRes.json()) as any;
    assert.strictEqual(successJson.status, 'success');
    assert.strictEqual(successJson.data.digimon.hunger, 20);
    assert.strictEqual(successJson.data.digimon.friendship, 61);
    assert.strictEqual(successJson.data.remainingQuantity, 4);

    const trainRes = await fetch(`${baseUrl}/api/v1/digimons/${digimonId}/train`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ stat: 'ATK', newTotal: 1000 }),
    });
    assert.strictEqual(trainRes.status, 200);
    const trainJson = (await trainRes.json()) as any;
    assert.strictEqual(trainJson.status, 'success');
    assert.strictEqual(trainJson.data.trainedStat, 'ATK');
    assert.strictEqual(trainJson.data.newTotal, 1000);
    assert.strictEqual(trainJson.data.totalStats.totalAtk, 1000);

    const restRes = await fetch(`${baseUrl}/api/v1/digimons/${digimonId}/rest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    assert.strictEqual(restRes.status, 200);
    const restJson = (await restRes.json()) as any;
    assert.strictEqual(restJson.status, 'success');
    assert.strictEqual(restJson.data.currentFatigue, 0);

    const statusRes = await fetch(
      `${baseUrl}/api/v1/digimons/${digimonId}/status`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    assert.strictEqual(statusRes.status, 200);
    const statusJson = (await statusRes.json()) as any;
    assert.strictEqual(statusJson.status, 'success');
    assert.strictEqual(statusJson.data.digimon.nickname, 'Gatomon');
    assert.strictEqual(statusJson.data.totalStats.totalAtk, 1000);
  });
});
