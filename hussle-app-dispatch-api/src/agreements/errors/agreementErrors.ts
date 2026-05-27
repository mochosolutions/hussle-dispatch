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
 * Thrown by createManualAgreement when a carrier already has a non-voided
 * SIGNED agreement for the requested template. Distinct from
 * AgreementAlreadyPendingError so the FE can prompt the admin appropriately
 * (e.g., "Void the existing signed agreement before uploading a new one").
 */
export class AgreementAlreadySignedError extends CustomError {
  statusCode = 409;
  readonly code = 'AGREEMENT_ALREADY_SIGNED';

  constructor(public existingAgreementId: string) {
    super('Carrier already has a signed agreement on file for this template');
    Object.setPrototypeOf(this, AgreementAlreadySignedError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}

/**
 * Alias of AgreementAlreadyPendingError specialized for the manual-upload
 * path so the controller can return a 409 with a descriptive client-facing
 * message and reference the existing agreement id.
 */
export class AgreementPendingExistsError extends CustomError {
  statusCode = 409;
  readonly code = 'AGREEMENT_PENDING_EXISTS';

  constructor(public existingAgreementId: string) {
    super(
      'A PENDING agreement already exists for this carrier+template; void it before uploading a manual one',
    );
    Object.setPrototypeOf(this, AgreementPendingExistsError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}

/**
 * Thrown when the carrierId referenced in a manual-upload request does not
 * match an active carrier in the requester's organization.
 */
export class CarrierNotFoundError extends CustomError {
  statusCode = 404;
  readonly code = 'CARRIER_NOT_FOUND';

  constructor(public carrierId: string) {
    super(`Carrier ${carrierId} not found`);
    Object.setPrototypeOf(this, CarrierNotFoundError.prototype);
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
