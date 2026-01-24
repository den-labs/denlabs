import { type NextRequest, NextResponse } from "next/server";
import { ApiError, ValidationError } from "./errors";
import { logger } from "./logger";

type RouteHandler<T = unknown> = (
  request: NextRequest,
  context: T,
) => Promise<Response>;

export function withErrorHandler<T>(
  handler: RouteHandler<T>,
  options?: { logRequest?: boolean },
) {
  return async (request: NextRequest, context: T): Promise<Response> => {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      if (options?.logRequest) {
        logger.info(
          {
            requestId,
            method: request.method,
            path: request.nextUrl.pathname,
          },
          "Request started",
        );
      }

      const response = await handler(request, context);

      logger.info(
        {
          requestId,
          duration: Date.now() - startTime,
          status: response.status,
        },
        "Request completed",
      );

      return response;
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.warn(
          {
            requestId,
            code: error.code,
            statusCode: error.statusCode,
            details: error.details,
          },
          error.message,
        );

        return NextResponse.json(
          {
            error: error.message,
            code: error.code,
            details: error.details,
          },
          { status: error.statusCode },
        );
      }

      if (error instanceof ApiError) {
        logger.warn(
          {
            requestId,
            code: error.code,
            statusCode: error.statusCode,
          },
          error.message,
        );

        return NextResponse.json(
          { error: error.message, code: error.code },
          { status: error.statusCode },
        );
      }

      logger.error(
        {
          requestId,
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        },
        "Unhandled error",
      );

      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  };
}
