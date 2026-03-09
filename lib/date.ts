const DAY_MS = 24 * 60 * 60 * 1000;

export function parseIsoDate(input: string): Date {
  return new Date(`${input}T00:00:00.000Z`);
}

export function getTripDaysInclusive(startDate: string, endDate: string): number {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  const diff = end.getTime() - start.getTime();
  return Math.floor(diff / DAY_MS) + 1;
}

export function isIsoDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
