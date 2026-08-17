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
  // req.query is a getter-only accessor on Express 5 — reassigning it throws.
  // Validated query params land on req.validatedQuery instead; body keeps the
  // original in-place assignment.
  if (source === 'query') {
    req.validatedQuery = parsed.data;
  } else {
    req[source] = parsed.data;
  }
  next();
};
