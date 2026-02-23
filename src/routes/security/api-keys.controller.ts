import type { Request, Response } from 'express';
import { sendApiResponse } from '../_shared/response.utils';
import { ApiKeyService } from '../../services/api-key.service';
import type { CreateApiKeyDto } from './api-keys.schemas';

export class ApiKeysController {
  constructor(private readonly service: ApiKeyService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as CreateApiKeyDto;
    const created = await this.service.create({
      name: body.name,
      scopes: body.scopes,
      expiresAt: body.expiresAt ?? null,
      createdByUserId: req.user?.id ?? null,
    });

    sendApiResponse(res, {
      statusCode: 201,
      title: 'Correcto',
      message: 'API key generada correctamente. Guarda el valor secreto, no se mostrara de nuevo.',
      data: created,
    });
  };

  list = async (_req: Request, res: Response): Promise<void> => {
    const rows = await this.service.list();
    sendApiResponse(res, {
      statusCode: 200,
      title: 'Correcto',
      message: 'Consulta completada correctamente.',
      data: rows,
    });
  };

  revoke = async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    await this.service.revoke(id);
    sendApiResponse(res, {
      statusCode: 200,
      title: 'Correcto',
      message: 'API key revocada correctamente.',
      data: { id },
    });
  };
}
