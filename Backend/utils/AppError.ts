export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string = "APP_ERROR",
    public details: unknown = null
  ) {
    super(message);
    this.name = "AppError";
  }
}