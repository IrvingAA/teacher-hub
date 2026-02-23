import type { Request, Response } from 'express';
import { TeacherService } from '../../services/teacher.service';
import {
  UpdateTeacherDto,
  CreateTeacherDto,
  listTeachersQuerySchema,
} from './teachers.schemas';
import { toTeacherResponseDto } from './teachers.mapper';
import { recordCrudAudit, toAuditSnapshot } from '../_shared/audit.utils';
import { sendApiResponse } from '../_shared/response.utils';
import type { MembershipRecord as TeacherRecord } from '../../types/repositories/membership-profile-repository.type';

export class TeachersController {
  constructor(private readonly service: TeacherService) {}

  private toAuditObject(entity: TeacherRecord | null): Record<string, unknown> | null {
    if (!entity) {
      return null;
    }
    return toAuditSnapshot(toTeacherResponseDto(entity));
  }

  create = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as CreateTeacherDto;
    const teacher = await this.service.create(body);
    await recordCrudAudit(req, {
      operation: 'created',
      statusCode: 201,
      resourceType: 'teacher',
      resourceId: teacher.id,
      after: this.toAuditObject(teacher),
    });
    sendApiResponse(res, {
      statusCode: 201,
      title: 'Correcto',
      message: 'Registro completado correctamente.',
      data: toTeacherResponseDto(teacher),
    });
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const query = listTeachersQuerySchema.parse(req.query);
    const result = await this.service.list(query);
    sendApiResponse(res, {
      statusCode: 200,
      title: 'Correcto',
      message: 'Consulta completada correctamente.',
      data: {
        data: result.data.map(toTeacherResponseDto),
        pagination: result.pagination,
      },
    });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const teacher = await this.service.getById(String(req.params.id));
    sendApiResponse(res, {
      statusCode: 200,
      title: 'Correcto',
      message: 'Consulta completada correctamente.',
      data: toTeacherResponseDto(teacher),
    });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as UpdateTeacherDto;
    const before = await this.service.getById(String(req.params.id));
    const teacher = await this.service.update(String(req.params.id), body);
    await recordCrudAudit(req, {
      operation: 'updated',
      statusCode: 200,
      resourceType: 'teacher',
      resourceId: teacher.id,
      before: this.toAuditObject(before),
      after: this.toAuditObject(teacher),
    });
    sendApiResponse(res, {
      statusCode: 200,
      title: 'Correcto',
      message: 'Registro actualizado correctamente.',
      data: toTeacherResponseDto(teacher),
    });
  };

  deactivate = async (req: Request, res: Response): Promise<void> => {
    const teacherId = String(req.params.id);
    const before = await this.service.getById(teacherId);

    if (!before.isActive) {
      sendApiResponse(res, {
        statusCode: 200,
        title: 'Información',
        message: 'El profesor ya está desactivado.',
        data: toTeacherResponseDto(before),
      });
      return;
    }

    const teacher = await this.service.deactivate(teacherId);

    await recordCrudAudit(req, {
      operation: 'updated',
      statusCode: 200,
      resourceType: 'teacher',
      resourceId: teacherId,
      before: this.toAuditObject(before),
      after: this.toAuditObject(teacher),
      metadata: { action: 'deactivated' },
    });

    sendApiResponse(res, {
      statusCode: 200,
      title: 'Correcto',
      message: 'Profesor desactivado correctamente.',
      data: toTeacherResponseDto(teacher),
    });
  };

  activate = async (req: Request, res: Response): Promise<void> => {
    const teacherId = String(req.params.id);
    const before = await this.service.getById(teacherId);

    if (before.isActive) {
      sendApiResponse(res, {
        statusCode: 200,
        title: 'Información',
        message: 'El profesor ya está activado.',
        data: toTeacherResponseDto(before),
      });
      return;
    }

    const teacher = await this.service.activate(teacherId);

    await recordCrudAudit(req, {
      operation: 'updated',
      statusCode: 200,
      resourceType: 'teacher',
      resourceId: teacherId,
      before: this.toAuditObject(before),
      after: this.toAuditObject(teacher),
      metadata: { action: 'activated' },
    });

    sendApiResponse(res, {
      statusCode: 200,
      title: 'Correcto',
      message: 'Profesor activado correctamente.',
      data: toTeacherResponseDto(teacher),
    });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const teacherId = String(req.params.id);
    const before = await this.service.getById(teacherId);
    await this.service.remove(teacherId);
    await recordCrudAudit(req, {
      operation: 'deleted',
      statusCode: 200,
      resourceType: 'teacher',
      resourceId: teacherId,
      before: this.toAuditObject(before),
    });
    sendApiResponse(res, {
      statusCode: 200,
      title: 'Correcto',
      message: 'Registro eliminado correctamente.',
      data: { id: teacherId },
    });
  };
}
