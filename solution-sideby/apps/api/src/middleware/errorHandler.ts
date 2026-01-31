import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger.js";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  logger.error(
    {
      err,
      method: req.method,
      url: req.originalUrl ?? req.url,
      statusCode: res.statusCode,
    },
    "Unhandled error in request handler",
  );

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    error: {
      message:
        process.env.NODE_ENV === "production"
          ? "An unexpected error occurred."
          : err.message,
      code: getErrorCode(statusCode),
    },
  });
};

/**
 * Maps HTTP status codes to semantic error codes for the API response.
 * @param statusCode - The HTTP status code
 * @returns A semantic error code string
 */
function getErrorCode(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return "VALIDATION_ERROR";
    case 401:
      return "AUTH_ERROR";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 500:
    default:
      return "INTERNAL_ERROR";
  }
}
