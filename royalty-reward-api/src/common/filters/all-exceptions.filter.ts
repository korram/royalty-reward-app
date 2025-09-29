import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const resp = exception.getResponse() as any;
      const message =
        (resp && (resp.message || resp.error)) || exception.message || 'Error';

      const details = typeof resp === 'object' ? resp : {};
      res.status(status).json({
        code: this.mapStatusToCode(status),
        message,
        details,
      });
      return;
    }

    // Unhandled error
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    res.status(status).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unexpected error',
      details: {},
    });
  }

  private mapStatusToCode(status: number) {
    switch (status) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 422:
        return 'UNPROCESSABLE_ENTITY';
      default:
        return 'ERROR';
    }
  }
}
