import { DeepPartial, FindManyOptions, FindOptionsWhere, ObjectLiteral, Repository } from 'typeorm';

export abstract class BaseRepository<T extends ObjectLiteral> {
  constructor(protected readonly repository: Repository<T>) {}

  create(data: DeepPartial<T>): T {
    return this.repository.create(data);
  }

  save(entity: DeepPartial<T>): Promise<T> {
    return this.repository.save(entity);
  }

  findOne(where: FindOptionsWhere<T>): Promise<T | null> {
    return this.repository.findOne({ where });
  }

  findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options);
  }

  count(options?: FindManyOptions<T>): Promise<number> {
    return this.repository.count(options);
  }

  async softDeleteById(id: string): Promise<boolean> {
    const result = await this.repository.softDelete(id);
    return Boolean(result.affected);
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return Boolean(result.affected);
  }

  async handleStatus(id: string, isActive: boolean): Promise<boolean> {
    const result = await this.repository.update(id as any, { isActive } as any);
    return Boolean(result.affected);
  }

  protected sanitizePatch<K extends keyof T>(
    patch: Partial<T>,
    allowedFields: readonly K[]
  ): Partial<Pick<T, K>> {
    const sanitized: Partial<Pick<T, K>> = {};

    for (const field of allowedFields) {
      const value = patch[field];
      if (value !== undefined) {
        sanitized[field] = value as T[K];
      }
    }

    return sanitized;
  }

  protected hasPatchChanges(patch: object): boolean {
    return Object.keys(patch).length > 0;
  }
}
