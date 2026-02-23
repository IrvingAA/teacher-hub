import { Event } from '../models/event.entity';
import { BaseRepository } from './base.repository';
import type { ListResult } from '../types/repositories/shared-repository.type';
import { resolveSort } from '../utils/sort.utils';
import { EVENT_SORTABLE_COLUMNS, ListEventsOptions } from '../types/repositories/event-repository.type';

export class EventRepository extends BaseRepository<Event> {
  findById(id: string): Promise<Event | null> {
    return this.findOne({ id });
  }

  async list(options: ListEventsOptions): Promise<ListResult<Event>> {
    const {
      page,
      limit,
      category,
      action,
      actorUserId,
      resourceType,
      resourceId,
      requestId,
      statusCode,
      search,
      sortBy,
      sortOrder,
    } = options;

    const sort = resolveSort(sortBy, sortOrder, EVENT_SORTABLE_COLUMNS);

    const qb = this.repository
      .createQueryBuilder('e')
      .orderBy(sort.column, sort.direction)
      .skip((page - 1) * limit)
      .take(limit);

    if (category) {
      qb.andWhere('e.category = :category', { category });
    }

    if (action) {
      qb.andWhere('e.action ILIKE :action', { action: `%${action}%` });
    }

    if (actorUserId) {
      qb.andWhere('e.actorUserId = :actorUserId', { actorUserId });
    }

    if (resourceType) {
      qb.andWhere('e.resourceType = :resourceType', { resourceType });
    }

    if (resourceId) {
      qb.andWhere('e.resourceId = :resourceId', { resourceId });
    }

    if (requestId) {
      qb.andWhere('e.requestId = :requestId', { requestId });
    }

    if (statusCode) {
      qb.andWhere('e.statusCode = :statusCode', { statusCode });
    }

    if (search) {
      qb.andWhere(
        `(e.action ILIKE :searchTerm
          OR COALESCE(e.path, '') ILIKE :searchTerm
          OR COALESCE(e.method, '') ILIKE :searchTerm
          OR COALESCE(e.resourceType, '') ILIKE :searchTerm
          OR COALESCE(e.resourceId, '') ILIKE :searchTerm)`,
        { searchTerm: `%${search}%` }
      );
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }
}
