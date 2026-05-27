import { CustomError } from '@mocho/common';

/**
 * Thrown when a required environment variable is missing or empty.
 * This is a startup-time error — never reaches the HTTP error handler — but
 * extends CustomError to comply with the project's "no generic Error" rule.
 */
export class MissingEnvError extends CustomError {
  statusCode = 500;
  readonly code = 'MISSING_ENV';
  readonly key: string;

  constructor(key: string) {
    super(`Missing required environment variable: ${key}`);
    this.key = key;
    Object.setPrototypeOf(this, MissingEnvError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}
