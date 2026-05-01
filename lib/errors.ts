export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function parseApiError(err: unknown): string {
  if (err instanceof ApiError) return `${err.status}: ${err.message}`;
  if (err instanceof Error) return err.message;
  return "An unexpected error occurred";
}
