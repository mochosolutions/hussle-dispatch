import { CustomError } from '@mocho/common';

/**
 * Thrown when a carrier already has a PENDING agreement for the requested
 * template. Returns 409 with a domain-specific code so clients can branch
 * on AGREEMENT_ALREADY_PENDING vs generic CONFLICT.
 */
export class AgreementAlreadyPendingError extends CustomError {
  statusCode = 409;
  readonly code = 'AGREEMENT_ALREADY_PENDING';

  constructor(public message = 'Carrier already has a PENDING agreement for this template') {
    super(message);
    Object.setPrototypeOf(this, AgreementAlreadyPendingError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}
