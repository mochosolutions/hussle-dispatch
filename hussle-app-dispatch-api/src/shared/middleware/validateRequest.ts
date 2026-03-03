import type { Request, Response, NextFunction } from 'express';
import type { ValidationError } from 'yup';
import { RequestValidationError } from '@/shared/errors/requestValidationError';
import type { ValidationSchema } from '@/shared/validators';

export const getFieldName = (path: string): string => {
  const parts = path.split('.');
  return parts[parts.length - 1] ?? path;
};

const isYupValidationError = (
  err: unknown,
): err is ValidationError & { inner: { message: string; path: string }[] } =>
  typeof err === 'object' &&
  err !== null &&
  'inner' in err &&
  Array.isArray((err as { inner: unknown }).inner);

export const validateRequest =
  (validator: ValidationSchema) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const validated = await validator.validate(
        {
          body: req.body,
          query: req.query,
          params: req.params,
        },
        {
          stripUnknown: true,
          abortEarly: false,
        },
      );
      req.body = validated.body;
      next();
    } catch (err: unknown) {
      if (isYupValidationError(err)) {
        const errorArr = err.inner.map((innerError) => ({
          message: innerError.message,
          field: getFieldName(innerError.path ?? ''),
        }));
        throw new RequestValidationError(errorArr);
      }
      throw err;
    }
  };
