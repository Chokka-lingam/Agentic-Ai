export function newRequestId(): string {
  return crypto.randomUUID();
}

export function logInfo(event: string, fields: Record<string, unknown>): void {
  console.info(
    JSON.stringify({
      level: "info",
      event,
      timestamp: new Date().toISOString(),
      ...fields,
    }),
  );
}

export function logError(event: string, fields: Record<string, unknown>): void {
  console.error(
    JSON.stringify({
      level: "error",
      event,
      timestamp: new Date().toISOString(),
      ...fields,
    }),
  );
}
