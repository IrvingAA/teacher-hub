import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppDataSource } from '../config/database.pg';
import { createAppError } from '../middlewares/errorHandler';
import type { LoginBodyDto } from '../routes/auth/auth.schemas';
import { User } from '../models/user.entity';
import { UserSchoolMembership } from '../models/user-school-membership.entity';
import { seedUsers } from '../config/seeds/users.seed';
import type { AuthLoginResult, AuthUserRecord } from '../types/auth/auth.type';
import { verifyPassword } from '../utils/security/password';
import { throttleService } from '../cache/throttle.service';

export class AuthService {
  async login(credentials: LoginBodyDto, ip: string = 'unknown'): Promise<AuthLoginResult> {
    const throttleKey = `login:${credentials.email}:${ip}`;

    const status = await throttleService.getStatus(throttleKey);
    if (status.isBlocked) {
      throw createAppError(
        `Demasiados intentos. Por favor, espera ${status.waitTimeSeconds} segundos.`,
        'TOO_MANY_ATTEMPTS',
        429
      );
    }

    if (!AppDataSource.isInitialized) {
      throw createAppError('Database is not initialized', 'DB_ERROR', 500);
    }

    const userRepository = AppDataSource.getRepository(User);
    const membershipRepository = AppDataSource.getRepository(UserSchoolMembership);

    const persisted = await userRepository.findOne({ 
      where: { email: credentials.email } 
    });

    if (!persisted || !(await verifyPassword(credentials.password, persisted.password))) {
      const nextStatus = await throttleService.recordAttempt(throttleKey);
      throw createAppError(
        `Credenciales invalidas. Acceso bloqueado por ${nextStatus.waitTimeSeconds} segundos.`,
        'INVALID_CREDENTIALS',
        401
      );
    }

    if (!persisted.isActive) {
      throw createAppError('Account is deactivated', 'ACCOUNT_DEACTIVATED', 403);
    }

    const persistedMemberships = await membershipRepository.find({
      where: { userId: persisted.id },
      relations: { school: true },
    });

    const mappedMemberships = persistedMemberships.map((membership) => ({
      schoolId: membership.schoolId,
      schoolName: membership.school?.name ?? membership.schoolId,
      role: membership.role,
      isDefault: membership.isDefault,
    }));

    const activeMembership = mappedMemberships.find((membership) => membership.isDefault) ??
      mappedMemberships[0] ?? {
        schoolId: persisted.tenantId,
        schoolName: persisted.tenantId,
        role: 'admin',
        isDefault: true,
      };

    const found: AuthUserRecord = {
      id: persisted.id,
      email: persisted.email,
      password: persisted.password,
      globalRole: persisted.globalRole,
      isActive: persisted.isActive,
      tenantId: activeMembership.schoolId,
      role: activeMembership.role,
      memberships: mappedMemberships.length > 0 ? mappedMemberships : [activeMembership],
    };

    await throttleService.clear(throttleKey);

    if (!env.JWT_SECRET) {
      throw createAppError('JWT is not configured', 'JWT_NOT_CONFIGURED', 500);
    }

    const payload = {
      sub: found.id,
      tenantId: found.tenantId,
      role: found.role,
      globalRole: found.globalRole,
      email: found.email,
    };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: '1h',
      ...(env.JWT_ISSUER ? { issuer: env.JWT_ISSUER } : {}),
      ...(env.JWT_AUDIENCE ? { audience: env.JWT_AUDIENCE } : {}),
    });

    const { password: _password, ...user } = found;

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: '1h',
      user,
    };
  }
}
