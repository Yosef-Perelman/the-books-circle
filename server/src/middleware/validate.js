import { ApiError } from '../utils/ApiError.js';

export const validate = (schema, source = 'body') => (req, res, next) => {
  const parsed = schema.safeParse(req[source]);
  if (!parsed.success) {
    throw new ApiError(
      422,
      'VALIDATION_ERROR',
      'Please check the fields and try again.',
      parsed.error.flatten().fieldErrors
    );
  }
  req[source] = parsed.data;
  next();
};
