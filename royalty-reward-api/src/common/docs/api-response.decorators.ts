import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  type ApiResponseOptions,
} from '@nestjs/swagger';
import { errorExamples } from '../examples/errors.examples';

export function ApiStdResponses(
  ok: ApiResponseOptions,
  created?: ApiResponseOptions,
): MethodDecorator {
  return applyDecorators(
    created ? ApiCreatedResponse(created) : ApiOkResponse(ok),
    ApiBadRequestResponse({
      description: 'Bad Request',
      examples: { bad: { summary: 'Validation failed', value: errorExamples.badRequest } },
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
      examples: { unauthorized: { summary: 'No/invalid token', value: errorExamples.unauthorized } },
    }),
    ApiForbiddenResponse({
      description: 'Forbidden',
      examples: { forbidden: { summary: 'Insufficient permission', value: errorExamples.forbidden } },
    }),
    ApiNotFoundResponse({
      description: 'Not Found',
      examples: { notFound: { summary: 'Resource not found', value: errorExamples.notFound } },
    }),
    ApiConflictResponse({
      description: 'Conflict',
      examples: { conflict: { summary: 'Conflict', value: errorExamples.conflict } },
    }),
    ApiUnprocessableEntityResponse({
      description: 'Unprocessable Entity',
      examples: { unprocessable: { summary: 'Semantic validation error', value: errorExamples.unprocessable } },
    }),
    ApiInternalServerErrorResponse({
      description: 'Server Error',
      examples: { serverError: { summary: 'Unexpected error', value: errorExamples.serverError } },
    }),
  );
}
