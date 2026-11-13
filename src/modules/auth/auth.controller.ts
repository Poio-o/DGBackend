import type { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { AppError } from '../../utils/errors';

export class AuthController {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  public static async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { username, email, password } = req.body ?? {};

      if (!username || !email || !password) {
        throw new AppError(
          'Nombre de usuario, correo electrónico y contraseña son obligatorios',
          400
        );
      }

      if (!AuthController.EMAIL_REGEX.test(email)) {
        throw new AppError('El formato del correo electrónico no es válido', 400);
      }

      if (typeof username !== 'string' || username.trim().length < 3) {
        throw new AppError(
          'El nombre de usuario debe contener al menos 3 caracteres',
          400
        );
      }

      if (typeof password !== 'string' || password.length < 6) {
        throw new AppError(
          'La contraseña debe tener una longitud mínima de 6 caracteres',
          400
        );
      }

      const result = await AuthService.register({
        username,
        email,
        password,
      });

      res.status(201).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async login(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { identifier, email, username, password } = req.body ?? {};
      const userIdentifier = identifier || email || username;

      if (!userIdentifier || !password) {
        throw new AppError(
          'Debe proporcionar un usuario/correo y una contraseña',
          400
        );
      }

      const result = await AuthService.login({
        identifier: String(userIdentifier),
        password: String(password),
      });

      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async me(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.sub) {
        throw new AppError('No autenticado', 401);
      }

      const user = await AuthService.getProfile(req.user.sub);

      res.status(200).json({
        status: 'success',
        user,
      });
    } catch (error) {
      next(error);
    }
  }
}
