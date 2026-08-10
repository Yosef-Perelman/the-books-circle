import { ApiError } from '../utils/ApiError.js';

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  console.error('[Unhandled Error]', err);
  return res.status(500).json({
    error: {
      code: 'INTERNAL',
      message: 'An unexpected error occurred.',
    },
  });
};
