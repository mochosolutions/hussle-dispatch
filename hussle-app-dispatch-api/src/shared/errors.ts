/**
 * Base error class for all typed application errors.
 * Extend this for each domain error — never throw generic Error.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly isOperational: boolean;

  constructor(message: string, statusCode: number, code: string, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  readonly details: string[];

  constructor(message: string, details: string[] = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class InvalidTransitionError extends AppError {
  readonly currentStatus: string;
  readonly targetStatus: string;
  readonly allowedTransitions: string[];

  constructor(currentStatus: string, targetStatus: string, allowedTransitions: string[]) {
    super(
      `Cannot move to ${targetStatus}. Allowed: ${allowedTransitions.join(', ')}`,
      422,
      'INVALID_STATUS_TRANSITION',
    );
    this.currentStatus = currentStatus;
    this.targetStatus = targetStatus;
    this.allowedTransitions = allowedTransitions;
  }
}

export class OnboardingBlockError extends AppError {
  readonly missingDocuments: string[];

  constructor(carrierName: string, missingDocuments: string[]) {
    super(
      `${carrierName} missing: ${missingDocuments.join(', ')}. Complete onboarding first.`,
      422,
      'ONBOARDING_INCOMPLETE',
    );
    this.missingDocuments = missingDocuments;
  }
}

export class ProhibitedCommodityError extends AppError {
  constructor(commodity: string) {
    super(`This commodity is prohibited per company policy: ${commodity}`, 422, 'PROHIBITED_COMMODITY');
  }
}

export class InsuranceExpiredError extends AppError {
  constructor(carrierName: string, expiryDate: Date) {
    super(
      `${carrierName} insurance expired ${expiryDate.toISOString().split('T')[0]}.`,
      422,
      'INSURANCE_EXPIRED',
    );
  }
}

export class ConcurrentEditError extends AppError {
  readonly updatedBy: string;
  readonly updatedAt: Date;

  constructor(updatedBy: string, updatedAt: Date) {
    super(
      `Updated by ${updatedBy} at ${updatedAt.toISOString()}. Please refresh.`,
      409,
      'CONCURRENT_EDIT',
    );
    this.updatedBy = updatedBy;
    this.updatedAt = updatedAt;
  }
}

export class OwnerOperatorNotSupportedError extends AppError {
  constructor() {
    super('OWNER_OPERATOR carrier type is not supported in this release.', 422, 'OWNER_OPERATOR_NOT_SUPPORTED');
  }
}

export const isAppError = (error: unknown): error is AppError =>
  error instanceof AppError;
