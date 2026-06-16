import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse() as string | Record<string, unknown>;
      const message = typeof res === 'string' ? res : (res.message as string) ?? 'Error';
      const details = typeof res === 'object' ? (res.details as unknown) ?? null : null;

      return response.status(status).json({
        data: null,
        error: { code: this.statusToCode(status), message, details },
        meta: null,
      });
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        return response.status(409).json({
          data: null,
          error: { code: 'CONFLICT', message: 'Resource already exists', details: null },
          meta: null,
        });
      }
      if (exception.code === 'P2025') {
        return response.status(404).json({
          data: null,
          error: { code: 'NOT_FOUND', message: 'Resource not found', details: null },
          meta: null,
        });
      }
    }

    this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : String(exception));

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      data: null,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred', details: null },
      meta: null,
    });
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      400: 'VALIDATION_ERROR',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'RATE_LIMIT_EXCEEDED',
      500: 'INTERNAL_SERVER_ERROR',
    };
    return map[status] ?? 'ERROR';
  }
}
