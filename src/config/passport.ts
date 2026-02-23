import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { z } from 'zod';
import { env } from './env';
import type { AppJwtPayload } from '../types/auth/auth.type';

const appJwtPayloadSchema = z.object({
  sub: z.string().min(1),
  tenantId: z.string().min(1),
  role: z.enum(['admin', 'teacher', 'student']).optional(),
  globalRole: z.enum(['owner', 'user']),
  email: z.string().email().optional(),
});

export function setupPassport(): void {
  if (!env.JWT_SECRET) {
    return;
  }

  const options: StrategyOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: env.JWT_SECRET,
    ...(env.JWT_ISSUER ? { issuer: env.JWT_ISSUER } : {}),
    ...(env.JWT_AUDIENCE ? { audience: env.JWT_AUDIENCE } : {}),
  };

  passport.use(
    new JwtStrategy(options, async (payload: AppJwtPayload, done) => {
      try {
        const parsed = appJwtPayloadSchema.safeParse(payload);
        if (!parsed.success) {
          return done(null, false);
        }

        const validPayload = parsed.data;

        const user: Express.User = {
          id: validPayload.sub,
          tenantId: validPayload.tenantId,
          role: validPayload.role ?? 'admin',
          globalRole: validPayload.globalRole,
          email: validPayload.email ?? '',
        };

        return done(null, user);
      } catch (err) {
        return done(err as Error, false);
      }
    })
  );
}

export default passport;
