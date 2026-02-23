import { School } from '../models/school.entity';
import { BaseRepository } from './base.repository';
import type { ListResult } from '../types/repositories/shared-repository.type';
import { resolveSort } from '../utils/sort.utils';
import type { UpdateSchoolDto } from '../routes/schools/schools.schemas';
import {
  ListSchoolsOptions,
  SCHOOL_ALLOWED_UPDATE_FIELDS,
  SCHOOL_SORTABLE_COLUMNS,
} from '../types/repositories/school-repository.type';

export class SchoolRepository extends BaseRepository<School> {
  findById(id: string): Promise<School | null> {
    return this.findOne({ id } as any);
  }

  findByName(name: string): Promise<School | null> {
    return this.findOne({ name } as any);
  }

  async list(options: ListSchoolsOptions): Promise<ListResult<School>> {
    const { page, limit, isActive, search, sortBy, sortOrder } = options;
    const sort = resolveSort(sortBy, sortOrder, SCHOOL_SORTABLE_COLUMNS);

    const qb = this.repository
      .createQueryBuilder('s')
      .orderBy(sort.column, sort.direction)
      .skip((page - 1) * limit)
      .take(limit);

    if (isActive !== undefined) {
      qb.andWhere('s.isActive = :isActive', { isActive });
    }

    if (search) {
      qb.andWhere('s.name ILIKE :searchTerm', { searchTerm: `%${search}%` });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async updateSchool(id: string, changes: UpdateSchoolDto | Partial<School>): Promise<School | null> {
    const safeChanges = this.sanitizePatch(changes, SCHOOL_ALLOWED_UPDATE_FIELDS);

    if (!this.hasPatchChanges(safeChanges)) {
      return this.findById(id);
    }

    await this.repository.update({ id }, safeChanges);
    return this.findById(id);
  }
}
