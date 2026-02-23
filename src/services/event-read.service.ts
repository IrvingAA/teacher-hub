import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.pg';
import { Event } from '../models/event.entity';
import { createAppError } from '../middlewares/errorHandler';
import { EventRepository } from '../repositories/event.repository';
import type { ListEventsQueryDto } from '../routes/events/events.schemas';
import type { PaginatedResult } from '../types/pagination/pagination.type';
import { buildPagination } from '../utils/pagination';

export class EventReadService {
  private readonly eventRepository: EventRepository;

  constructor(repository?: Repository<Event>) {
    this.eventRepository = new EventRepository(repository ?? AppDataSource.getRepository(Event));
  }

  async list(query: ListEventsQueryDto): Promise<PaginatedResult<Event>> {
    const { data, total } = await this.eventRepository.list(query);

    return {
      data,
      pagination: buildPagination(query.page, query.limit, total),
    };
  }

  async getById(id: string): Promise<Event> {
    const event = await this.eventRepository.findById(id);
    if (!event) {
      throw createAppError('Event not found', 'EVENT_NOT_FOUND', 404);
    }

    return event;
  }
}
