import type { Request, Response } from 'express';
import { StudentService } from '../../services/student.service';
import { CreateUserDto, userParamsSchema } from '../users/users.schemas';
import { UpdateTeacherDto, listTeachersQuerySchema } from '../teachers/teachers.schemas';
import { toTeacherResponseDto } from '../teachers/teachers.mapper';
import { recordCrudAudit, toAuditSnapshot } from '../_shared/audit.utils';
import { sendApiResponse } from '../_shared/response.utils';
import type { MembershipRecord } from '../../types/repositories/membership-profile-repository.type';

export class StudentsController {
  constructor(private readonly service: StudentService) {}

  private toAuditObject(entity: MembershipRecord | null): Record<string, unknown> | null {
    if (!entity) {
      return null;
    }
    return toAuditSnapshot(toTeacherResponseDto(entity));
  }

  create = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as CreateUserDto;
    const student = await this.service.create(body);

    await recordCrudAudit(req, {
      operation: 'created',
      statusCode: 201,
      resourceType: 'student',
      resourceId: student.id,
      after: this.toAuditObject(student),
    });

    sendApiResponse(res, {
      statusCode: 201,
      title: 'Correcto',
      message: 'Estudiante creado correctamente.',
      data: toTeacherResponseDto(student),
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
    const student = await this.service.getById(String(req.params.id));

    sendApiResponse(res, {
      statusCode: 200,
      title: 'Correcto',
      message: 'Consulta completada correctamente.',
      data: toTeacherResponseDto(student),
    });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as UpdateTeacherDto;
    const studentId = String(req.params.id);
    const before = await this.service.getById(studentId);
    const updated = await this.service.update(studentId, body);

    await recordCrudAudit(req, {
      operation: 'updated',
      statusCode: 200,
      resourceType: 'student',
      resourceId: studentId,
      before: this.toAuditObject(before),
      after: this.toAuditObject(updated),
    });

    sendApiResponse(res, {
      statusCode: 200,
      title: 'Correcto',
      message: 'Registro actualizado correctamente.',
      data: toTeacherResponseDto(updated),
    });
  };

  deactivate = async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const before = await this.service.getById(id);

    if (!before.isActive) {
      sendApiResponse(res, {
        statusCode: 200,
        title: 'Información',
        message: 'El estudiante ya está desactivado.',
        data: toTeacherResponseDto(before),
      });
      return;
    }

    const student = await this.service.deactivate(id);

    sendApiResponse(res, {
      statusCode: 200,
      title: 'Correcto',
      message: 'Estudiante desactivado correctamente.',
      data: toTeacherResponseDto(student),
    });
  };

  activate = async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const before = await this.service.getById(id);

    if (before.isActive) {
      sendApiResponse(res, {
        statusCode: 200,
        title: 'Información',
        message: 'El estudiante ya está activado.',
        data: toTeacherResponseDto(before),
      });
      return;
    }

    const student = await this.service.activate(id);

    sendApiResponse(res, {
      statusCode: 200,
      title: 'Correcto',
      message: 'Estudiante activado correctamente.',
      data: toTeacherResponseDto(student),
    });
  };
}
