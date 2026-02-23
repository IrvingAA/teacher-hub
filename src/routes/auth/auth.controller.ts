import type { Request, Response } from 'express';
import { AuthService } from '../../services/auth.service';
import type { LoginBodyDto } from './auth.schemas';
import { recordResourceAudit } from '../_shared/audit.utils';
import { sendApiResponse } from '../_shared/response.utils';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as LoginBodyDto;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const result = await this.authService.login(body, ip);
    await recordResourceAudit(req, {
      action: 'auth.login.succeeded',
      statusCode: 200,
      resourceType: 'user',
      resourceId: result.user.id,
      metadata: {
        email: result.user.email,
        globalRole: result.user.globalRole,
        tenantRole: result.user.role,
        tenantId: result.user.tenantId,
      },
    });
    sendApiResponse(res, {
      statusCode: 200,
      title: 'Correcto',
      message: 'Autenticacion completada correctamente.',
      data: result,
    });
  };
}
