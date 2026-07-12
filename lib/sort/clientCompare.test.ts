import {
  compareBoolean,
  compareDate,
  compareNumber,
  compareText,
  ClientSortDirection,
} from './clientCompare';

describe('clientCompare', () => {
  it('compares Turkish text with locale', () => {
    expect(compareText('çalışan', 'deniz', 'ASC')).toBeLessThan(0);
    expect(compareText('deniz', 'çalışan', 'DESC')).toBeLessThan(0);
  });

  it('compares numbers numerically', () => {
    expect(compareNumber(2, 10, 'ASC')).toBeLessThan(0);
    expect(compareNumber(10, 2, 'DESC')).toBeLessThan(0);
  });

  it('compares dates as timestamps', () => {
    expect(compareDate('2024-01-02', '2024-01-10', 'ASC')).toBeLessThan(0);
    expect(compareDate('2024-01-10', '2024-01-02', 'DESC')).toBeLessThan(0);
  });

  it('compares booleans', () => {
    expect(compareBoolean(false, true, 'ASC')).toBeLessThan(0);
    expect(compareBoolean(true, false, 'DESC')).toBeLessThan(0);
  });

  it('respects direction type', () => {
    const dir: ClientSortDirection = 'ASC';
    expect(compareNumber(1, 2, dir)).toBeLessThan(0);
  });
});
