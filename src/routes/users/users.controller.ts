import type { Request, Response } from 'express';
import { UserService } from '../../services/user.service';
import type { CreateUserDto, UpdateUserDto } from './users.schemas';
import { listUsersQuerySchema } from './users.schemas';
import { toUserResponseDto } from './users.mapper';
import type { UserAggregate } from './users.mapper';
import { recordCrudAudit, toAuditSnapshot } from '../_shared/audit.utils';
import { sendApiResponse } from '../_shared/response.utils';

export class UsersController {
  constructor(private readonly service: UserService) {}

  private toAuditObject(entity: UserAggregate | null): Record<string, unknown> | null {
    if (!entity) {
      return null;
    }

    return toAuditSnapshot(toUserResponseDto(entity));
  }

  create = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as CreateUserDto;
    const user = await this.service.create(body);

    await recordCrudAudit(req, {
      operation: 'created',
      statusCode: 201,
      resourceType: 'user',
      resourceId: user.user.id,
      after: this.toAuditObject(user),
    });

    sendApiResponse(res, {
      statusCode: 201,
      title: 'Correcto',
      message: 'Registro completado correctamente.',
      data: toUserResponseDto(user),
    });
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const query = listUsersQuerySchema.parse(req.query);
    const result = await this.service.list(query);

    sendApiResponse(res, {
      statusCode: 200,
      title: 'Correcto',
      message: 'Consulta completada correctamente.',
      data: {
        data: result.data.map(toUserResponseDto),
        pagination: result.pagination,
      },
    });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const user = await this.service.getById(String(req.params.id));

    sendApiResponse(res, {
      statusCode: 200,
      title: 'Correcto',
      message: 'Consulta completada correctamente.',
      data: toUserResponseDto(user),
    });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as UpdateUserDto;
    const before = await this.service.getById(String(req.params.id));
    const updated = await this.service.update(String(req.params.id), body);

    await recordCrudAudit(req, {
      operation: 'updated',
      statusCode: 200,
      resourceType: 'user',
      resourceId: updated.user.id,
      before: this.toAuditObject(before),
      after: this.toAuditObject(updated),
    });

    sendApiResponse(res, {
      statusCode: 200,
      title: 'Correcto',
      message: 'Registro actualizado correctamente.',
      data: toUserResponseDto(updated),
    });
  };

  deactivate = async (req: Request, res: Response): Promise<void> => {
    const userId = String(req.params.id);
    const before = await this.service.getById(userId);
    
    if (!before.user.isActive) {
      sendApiResponse(res, {
        statusCode: 200,
        title: 'Información',
        message: 'El usuario ya está desactivado.',
        data: toUserResponseDto(before),
      });
      return;
    }

    const updated = await this.service.deactivate(userId);

    await recordCrudAudit(req, {
      operation: 'status.updated',
      statusCode: 200,
      resourceType: 'user',
      resourceId: userId,
      before: this.toAuditObject(before),
      after: this.toAuditObject(updated),
      metadata: { action: 'deactivated' },
    });

    sendApiResponse(res, {
      statusCode: 200,
      title: 'Correcto',
      message: 'Usuario desactivado correctamente.',
      data: toUserResponseDto(updated),
    });
  };

  activate = async (req: Request, res: Response): Promise<void> => {
    const userId = String(req.params.id);
    const before = await this.service.getById(userId);

    if (before.user.isActive) {
      sendApiResponse(res, {
        statusCode: 200,
        title: 'Información',
        message: 'El usuario ya está activado.',
        data: toUserResponseDto(before),
      });
      return;
    }

    const updated = await this.service.activate(userId);

    await recordCrudAudit(req, {
      operation: 'status.updated',
      statusCode: 200,
      resourceType: 'user',
      resourceId: userId,
      before: this.toAuditObject(before),
      after: this.toAuditObject(updated),
      metadata: { action: 'activated' },
    });

    sendApiResponse(res, {
      statusCode: 200,
      title: 'Correcto',
      message: 'Usuario activado correctamente.',
      data: toUserResponseDto(updated),
    });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const userId = String(req.params.id);
    const before = await this.service.getById(userId);
    await this.service.remove(userId);

    await recordCrudAudit(req, {
      operation: 'deleted',
      statusCode: 200,
      resourceType: 'user',
      resourceId: userId,
      before: this.toAuditObject(before),
    });

    sendApiResponse(res, {
      statusCode: 200,
      title: 'Correcto',
      message: 'Registro eliminado correctamente.',
      data: { id: userId },
    });
  };
}
