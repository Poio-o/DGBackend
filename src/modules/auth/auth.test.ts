import { describe, it } from 'node:test';
import assert from 'node:assert';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { authMiddleware } from '../../middleware/authMiddleware';

describe('Auth module', () => {
  const plainPassword = 'DigiPassword2026!';
  const saltRounds = 10;

  it('hashea la contraseña con bcrypt', async () => {
    const hash = await bcrypt.hash(plainPassword, saltRounds);

    assert.notStrictEqual(hash, plainPassword);
    assert.strictEqual(hash.startsWith('$2'), true);

    const isValid = await bcrypt.compare(plainPassword, hash);
    assert.strictEqual(isValid, true);

    const isInvalid = await bcrypt.compare('WrongPassword', hash);
    assert.strictEqual(isInvalid, false);
  });

  it('genera y firma un token JWT válido', () => {
    const payload = {
      sub: 'cuid_test_123',
      username: 'TaiKamiya',
      email: 'tai@digiworld.com',
    };

    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });

    assert.ok(token);
    assert.strictEqual(typeof token, 'string');
    assert.strictEqual(token.split('.').length, 3);

    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    assert.strictEqual(decoded.sub, payload.sub);
    assert.strictEqual(decoded.username, payload.username);
    assert.strictEqual(decoded.email, payload.email);
    assert.ok(decoded.exp);
  });

  it('rechaza peticiones sin header de autorizacion con 401', () => {
    let statusCode: number | null = null;
    let jsonBody: any = null;
    let nextCalled = false;

    const req: any = { headers: {} };
    const res: any = {
      status: (code: number) => {
        statusCode = code;
        return {
          json: (body: any) => {
            jsonBody = body;
          },
        };
      },
    };
    const next = () => {
      nextCalled = true;
    };

    authMiddleware(req, res, next);

    assert.strictEqual(statusCode, 401);
    assert.strictEqual(jsonBody?.status, 'error');
    assert.strictEqual(nextCalled, false);
  });

  it('rechaza tokens invalidos con 401', () => {
    let statusCode: number | null = null;
    let nextCalled = false;

    const req: any = { headers: { authorization: 'Bearer invalid_token' } };
    const res: any = {
      status: (code: number) => {
        statusCode = code;
        return { json: () => {} };
      },
    };
    const next = () => {
      nextCalled = true;
    };

    authMiddleware(req, res, next);

    assert.strictEqual(statusCode, 401);
    assert.strictEqual(nextCalled, false);
  });

  it('permite el acceso con un token valido y adjunta el usuario al request', () => {
    const payload = {
      sub: 'cuid_test_456',
      username: 'YamatoIshida',
      email: 'matt@digiworld.com',
    };
    const token = jwt.sign(payload, env.JWT_SECRET);

    let nextCalled = false;
    const req: any = { headers: { authorization: `Bearer ${token}` } };
    const res: any = {
      status: () => ({ json: () => {} }),
    };
    const next = () => {
      nextCalled = true;
    };

    authMiddleware(req, res, next);

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.user?.sub, payload.sub);
    assert.strictEqual(req.user?.username, payload.username);
  });
});
