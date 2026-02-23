import type { Request, Response } from 'express';
import { SchoolService } from '../../services/school.service';
import type { CreateSchoolDto, UpdateSchoolDto } from './schools.schemas';
import { listSchoolsQuerySchema } from './schools.schemas';
import { recordCrudAudit, toAuditSnapshot } from '../_shared/audit.utils';
import { sendApiResponse } from '../_shared/response.utils';
import type { School } from '../../models/school.entity';

export class SchoolsController {
  constructor(private readonly service: SchoolService) {}

  private toAuditObject(entity: School | null): Record<string, unknown> | null {
    if (!entity) {
      return null;
    }

    return toAuditSnapshot(entity);
  }

  create = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as CreateSchoolDto;
    const school = await this.service.create(body);

    await recordCrudAudit(req, {
      operation: 'created',
      statusCode: 201,
      resourceType: 'school',
      resourceId: school.id,
      after: this.toAuditObject(school),
    });

    sendApiResponse(res, {
      statusCode: 201,
      title: 'Correcto',
      message: 'Registro completado correctamente.',
      data: school,
    });
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const query = listSchoolsQuerySchema.parse(req.query);
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
    const school = await this.service.getById(String(req.params.id));

    sendApiResponse(res, {
      statusCode: 200,
      title: 'Correcto',
      message: 'Consulta completada correctamente.',
      data: school,
    });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as UpdateSchoolDto;
    const before = await this.service.getById(String(req.params.id));
    const school = await this.service.update(String(req.params.id), body);

    await recordCrudAudit(req, {
      operation: 'updated',
      statusCode: 200,
      resourceType: 'school',
      resourceId: school.id,
      before: this.toAuditObject(before),
      after: this.toAuditObject(school),
    });

    sendApiResponse(res, {
      statusCode: 200,
      title: 'Correcto',
      message: 'Registro actualizado correctamente.',
      data: school,
    });
  };

  deactivate = async (req: Request, res: Response): Promise<void> => {
    const schoolId = String(req.params.id);
    const before = await this.service.getById(schoolId);

    if (!before.isActive) {
      sendApiResponse(res, {
        statusCode: 200,
        title: 'Información',
        message: 'La escuela ya está desactivada.',
        data: before,
      });
      return;
    }

    const school = await this.service.deactivate(schoolId);

    await recordCrudAudit(req, {
      operation: 'updated',
      statusCode: 200,
      resourceType: 'school',
      resourceId: schoolId,
      before: this.toAuditObject(before),
      after: this.toAuditObject(school),
      metadata: { action: 'deactivated' },
    });

    sendApiResponse(res, {
      statusCode: 200,
      title: 'Correcto',
      message: 'Escuela desactivada correctamente.',
      data: school,
    });
  };

  activate = async (req: Request, res: Response): Promise<void> => {
    const schoolId = String(req.params.id);
    const before = await this.service.getById(schoolId);

    if (before.isActive) {
      sendApiResponse(res, {
        statusCode: 200,
        title: 'Información',
        message: 'La escuela ya está activada.',
        data: before,
      });
      return;
    }

    const school = await this.service.activate(schoolId);

    await recordCrudAudit(req, {
      operation: 'updated',
      statusCode: 200,
      resourceType: 'school',
      resourceId: schoolId,
      before: this.toAuditObject(before),
      after: this.toAuditObject(school),
      metadata: { action: 'activated' },
    });

    sendApiResponse(res, {
      statusCode: 200,
      title: 'Correcto',
      message: 'Escuela activada correctamente.',
      data: school,
    });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const schoolId = String(req.params.id);
    const before = await this.service.getById(schoolId);
    await this.service.remove(schoolId);

    await recordCrudAudit(req, {
      operation: 'deleted',
      statusCode: 200,
      resourceType: 'school',
      resourceId: schoolId,
      before: this.toAuditObject(before),
    });

    sendApiResponse(res, {
      statusCode: 200,
      title: 'Correcto',
      message: 'Registro eliminado correctamente.',
      data: { id: schoolId },
    });
  };
}
