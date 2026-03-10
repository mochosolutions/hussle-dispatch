import { CustomError } from '@mocho/common';

export class GoneError extends CustomError {
  statusCode = 410;
  readonly code = 'GONE';

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, GoneError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}
