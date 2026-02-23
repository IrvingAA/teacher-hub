import type { ListSchoolsQueryDto } from '../../routes/schools/schools.schemas';

export interface ListSchoolsOptions extends ListSchoolsQueryDto {}

export const SCHOOL_ALLOWED_UPDATE_FIELDS = ['name', 'isActive'] as const;

export const SCHOOL_SORTABLE_COLUMNS: Record<ListSchoolsQueryDto['sortBy'], string> = {
  name: 's.name',
  createdAt: 's.createdAt',
  updatedAt: 's.updatedAt',
};
