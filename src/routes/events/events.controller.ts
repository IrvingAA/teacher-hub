import type { Request, Response } from 'express';
import { EventReadService } from '../../services/event-read.service';
import { listEventsQuerySchema } from './events.schemas';
import { sendApiResponse } from '../_shared/response.utils';

export class EventsController {
  constructor(private readonly service: EventReadService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const query = listEventsQuerySchema.parse(req.query);
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
    const event = await this.service.getById(String(req.params.id));

    sendApiResponse(res, {
      statusCode: 200,
      title: 'Correcto',
      message: 'Consulta completada correctamente.',
      data: event,
    });
  };
}
