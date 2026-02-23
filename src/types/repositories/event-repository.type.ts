import type { ListEventsQueryDto } from '../../routes/events/events.schemas';

export interface ListEventsOptions extends ListEventsQueryDto {}

export const EVENT_SORTABLE_COLUMNS: Record<ListEventsQueryDto['sortBy'], string> = {
  createdAt: 'e.createdAt',
  action: 'e.action',
  statusCode: 'e.statusCode',
};
