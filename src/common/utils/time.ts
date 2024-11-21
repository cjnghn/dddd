// src/common/utils/time.ts
export function interpolateValue(
  start: number,
  end: number,
  ratio: number,
): number {
  return start + (end - start) * ratio;
}

export function interpolateDate(start: Date, end: Date, ratio: number): Date {
  return new Date(start.getTime() + (end.getTime() - start.getTime()) * ratio);
}
