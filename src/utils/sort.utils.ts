export function resolveSort(
  sortBy: string,
  sortOrder: 'asc' | 'desc',
  columns: Record<string, string>
) {
  const column = columns[sortBy] || Object.values(columns)[0];
  const direction = (sortOrder.toUpperCase() as 'ASC' | 'DESC') || 'DESC';
  return { column, direction };
}
