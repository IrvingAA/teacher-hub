import type { Request, Response } from 'express';
import { GroupService, CreateGroupDto, UpdateGroupDto } from '../../services/group.service';
import { listGroupsQuerySchema } from '../../repositories/group.repository';
import { recordCrudAudit, toAuditSnapshot } from '../_shared/audit.utils';
import { sendApiResponse } from '../_shared/response.utils';
import type { Group } from '../../models/group.entity';

export class GroupsController {
  constructor(private readonly service: GroupService) {}

  private toAuditObject(entity: Group | null): Record<string, unknown> | null {
    if (!entity) {
      return null;
    }
    return toAuditSnapshot(entity);
  }

  create = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as CreateGroupDto;
    const group = await this.service.create(body);

    await recordCrudAudit(req, {
      operation: 'created',
      statusCode: 201,
      resourceType: 'group',
      resourceId: group.id,
      after: this.toAuditObject(group),
    });

    sendApiResponse(res, {
      statusCode: 201,
      title: 'Correcto',
      message: 'Grupo creado correctamente.',
      data: group,
    });
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const query = listGroupsQuerySchema.parse(req.query);
    const result = await this.service.list(query);

    sendApiResponse(res, {
      statusCode: 200,
      title: 'Correcto',
      message: 'Consulta completada correctamente.',
      data: {
        data: result.data,
        pagination: result.pagination,
      },
    });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const group = await this.service.getById(String(req.params.id));

    sendApiResponse(res, {
      statusCode: 200,
      title: 'Correcto',
      message: 'Consulta completada correctamente.',
      data: group,
    });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as UpdateGroupDto;
    const before = await this.service.getById(String(req.params.id));
    const group = await this.service.update(String(req.params.id), body);

    await recordCrudAudit(req, {
      operation: 'updated',
      statusCode: 200,
      resourceType: 'group',
      resourceId: group.id,
      before: this.toAuditObject(before),
      after: this.toAuditObject(group),
    });

    sendApiResponse(res, {
      statusCode: 200,
      title: 'Correcto',
      message: 'Grupo actualizado correctamente.',
      data: group,
    });
  };

  deactivate = async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const before = await this.service.getById(id);

    if (!before.isActive) {
      sendApiResponse(res, {
        statusCode: 200,
        title: 'Información',
        message: 'El grupo ya está desactivado.',
        data: before,
      });
      return;
    }

    const group = await this.service.deactivate(id);

    sendApiResponse(res, {
      statusCode: 200,
      title: 'Correcto',
      message: 'Grupo desactivado correctamente.',
      data: group,
    });
  };

  activate = async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const before = await this.service.getById(id);

    if (before.isActive) {
      sendApiResponse(res, {
        statusCode: 200,
        title: 'Información',
        message: 'El grupo ya está activado.',
        data: before,
      });
      return;
    }

    const group = await this.service.activate(id);

    sendApiResponse(res, {
      statusCode: 200,
      title: 'Correcto',
      message: 'Grupo activado correctamente.',
      data: group,
    });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const groupId = String(req.params.id);
    const before = await this.service.getById(groupId);
    await this.service.remove(groupId);

    await recordCrudAudit(req, {
      operation: 'deleted',
      statusCode: 200,
      resourceType: 'group',
      resourceId: groupId,
      before: this.toAuditObject(before),
    });

    sendApiResponse(res, {
      statusCode: 200,
      title: 'Correcto',
      message: 'Grupo eliminado correctamente.',
      data: { id: groupId },
    });
  };
}
