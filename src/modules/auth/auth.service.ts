import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/db';
import { env } from '../../config/env';
import { AppError } from '../../utils/errors';
import type {
  RegisterDto,
  LoginDto,
  AuthSuccessResponse,
  JwtPayload,
  UserResponse,
} from './auth.types';

export class AuthService {
  private static readonly SALT_ROUNDS = 10;

  private static generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });
  }

  private static toUserResponse(user: {
    id: string;
    username: string;
    email: string;
    createdAt: Date;
  }): UserResponse {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  public static async register(dto: RegisterDto): Promise<AuthSuccessResponse> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const normalizedUsername = dto.username.trim();

    const existingEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingEmail) {
      throw new AppError('El correo electrónico ya está registrado', 409);
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username: normalizedUsername },
    });
    if (existingUsername) {
      throw new AppError('El nombre de usuario ya está en uso', 409);
    }

    const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          username: normalizedUsername,
        },
      });

      await tx.credential.create({
        data: {
          userId: user.id,
          provider: 'local',
          secret: passwordHash,
        },
      });

      return user;
    });

    const tokenPayload: JwtPayload = {
      sub: newUser.id,
      username: newUser.username,
      email: newUser.email,
    };
    const token = this.generateToken(tokenPayload);

    return {
      message: 'Usuario registrado con éxito',
      token,
      user: this.toUserResponse(newUser),
    };
  }

  public static async login(dto: LoginDto): Promise<AuthSuccessResponse> {
    const identifier = dto.identifier.trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { username: identifier },
        ],
      },
      include: {
        credentials: {
          where: { provider: 'local' },
        },
      },
    });

    if (!user) {
      throw new AppError('Credenciales incorrectas', 401);
    }

    const localCredential = user.credentials[0];
    if (!localCredential) {
      throw new AppError(
        'Este usuario no dispone de credenciales de acceso local',
        401
      );
    }

    const isValidPassword = await bcrypt.compare(
      dto.password,
      localCredential.secret
    );

    if (!isValidPassword) {
      throw new AppError('Credenciales incorrectas', 401);
    }

    const tokenPayload: JwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
    };
    const token = this.generateToken(tokenPayload);

    return {
      message: 'Inicio de sesión correcto',
      token,
      user: this.toUserResponse(user),
    };
  }

  public static async getProfile(userId: string): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    return this.toUserResponse(user);
  }
}
