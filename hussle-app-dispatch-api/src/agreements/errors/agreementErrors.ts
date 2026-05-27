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

/**
 * Thrown when attempting to void an agreement that is not in PENDING state.
 * Returns 409 with a domain-specific code so clients can branch on
 * AGREEMENT_NOT_VOIDABLE vs generic CONFLICT or INVALID_STATUS_TRANSITION.
 */
export class AgreementNotVoidableError extends CustomError {
  statusCode = 409;
  readonly code = 'AGREEMENT_NOT_VOIDABLE';
  readonly currentStatus: string;

  constructor(currentStatus: string) {
    super(
      `Agreement cannot be voided from status ${currentStatus}; only PENDING agreements may be voided`,
    );
    this.currentStatus = currentStatus;
    Object.setPrototypeOf(this, AgreementNotVoidableError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}
