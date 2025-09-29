export const errorExamples = {
  badRequest: {
    code: 'BAD_REQUEST',
    message: 'Validation failed',
    details: {
      field: 'email',
      constraints: { isEmail: 'email must be an email' },
    },
  },
  unauthorized: {
    code: 'UNAUTHORIZED',
    message: 'Unauthorized',
    details: {},
  },
  forbidden: {
    code: 'FORBIDDEN',
    message: 'Forbidden',
    details: {},
  },
  notFound: {
    code: 'NOT_FOUND',
    message: 'Resource not found',
    details: {},
  },
  conflict: {
    code: 'CONFLICT',
    message: 'Resource conflict',
    details: {},
  },
  unprocessable: {
    code: 'UNPROCESSABLE_ENTITY',
    message: 'Unprocessable entity',
    details: {},
  },
  serverError: {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Unexpected error',
    details: {},
  },
};
