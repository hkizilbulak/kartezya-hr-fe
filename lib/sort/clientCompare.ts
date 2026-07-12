/**
 * Client-side comparators for full-dataset table sorting (Phase 4).
 * Sort the complete filtered array before any pagination slice.
 */

export type ClientSortDirection = 'ASC' | 'DESC';

export function compareText(a: string, b: string, direction: ClientSortDirection): number {
  const cmp = String(a ?? '').localeCompare(String(b ?? ''), 'tr-TR', { sensitivity: 'base' });
  return direction === 'ASC' ? cmp : -cmp;
}

export function compareNumber(a: number | null | undefined, b: number | null | undefined, direction: ClientSortDirection): number {
  const na = a == null || Number.isNaN(Number(a)) ? null : Number(a);
  const nb = b == null || Number.isNaN(Number(b)) ? null : Number(b);
  if (na == null && nb == null) return 0;
  if (na == null) return direction === 'ASC' ? 1 : -1;
  if (nb == null) return direction === 'ASC' ? -1 : 1;
  const cmp = na - nb;
  return direction === 'ASC' ? cmp : -cmp;
}

export function compareDate(
  a: string | Date | null | undefined,
  b: string | Date | null | undefined,
  direction: ClientSortDirection
): number {
  const ta = a ? new Date(a).getTime() : NaN;
  const tb = b ? new Date(b).getTime() : NaN;
  const na = Number.isFinite(ta) ? ta : null;
  const nb = Number.isFinite(tb) ? tb : null;
  return compareNumber(na, nb, direction);
}

export function compareBoolean(a: boolean, b: boolean, direction: ClientSortDirection): number {
  const na = a ? 1 : 0;
  const nb = b ? 1 : 0;
  return compareNumber(na, nb, direction);
}
