import { CustomError } from '@mocho/common';

interface ValidationError {
  message: string;
  field: string;
}

export class RequestValidationError extends CustomError {
  statusCode = 400;

  constructor(public errors: ValidationError[]) {
    super('Invalid request parameters');
    Object.setPrototypeOf(this, RequestValidationError.prototype);
  }

  serializeErrors() {
    return this.errors.map((err) => ({ message: err.message, field: err.field }));
  }
}
