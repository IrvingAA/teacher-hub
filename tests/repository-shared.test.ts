import { resolveSort } from '../src/utils/sort.utils';

describe('Shared Repository Utils', () => {
  it('resolveSort returns default column and DESC when input is missing', () => {
    const columns = { name: 'u.name', date: 'u.date' };
    const result = resolveSort('missing', 'desc', columns);
    expect(result.column).toBe('u.name');
    expect(result.direction).toBe('DESC');
  });

  it('resolveSort returns mapped column and ASC', () => {
    const columns = { name: 'u.name', date: 'u.date' };
    const result = resolveSort('date', 'asc', columns);
    expect(result.column).toBe('u.date');
    expect(result.direction).toBe('ASC');
  });
});
