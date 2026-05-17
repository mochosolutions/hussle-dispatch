/**
 * Core domain error classes — all extend CustomError from @mocho/common.
 * Each class provides serializeErrors() for consistent API error responses.
 */
import { CustomError } from '@mocho/common';

export class NotFoundError extends CustomError {
  statusCode = 404;
  readonly code = 'NOT_FOUND';

  constructor(public message: string) {
    super(message);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}

export class ValidationError extends CustomError {
  statusCode = 400;
  readonly code = 'VALIDATION_ERROR';
  readonly details: string[];

  constructor(message: string, details: string[] = []) {
    super(message);
    this.details = details;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  serializeErrors() {
    if (this.details.length > 0) {
      return this.details.map((detail) => ({ message: detail }));
    }
    return [{ message: this.message }];
  }
}

export class ConflictError extends CustomError {
  statusCode = 409;
  readonly code = 'CONFLICT';

  constructor(public message: string) {
    super(message);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}

export class ActiveLoadsConflictError extends CustomError {
  statusCode = 409;
  readonly code = 'ACTIVE_LOADS';
  readonly blockingLoadIds: string[];

  constructor(message: string, blockingLoadIds: string[]) {
    super(message);
    this.blockingLoadIds = blockingLoadIds;
    Object.setPrototypeOf(this, ActiveLoadsConflictError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}

export interface AssignmentBlocker {
  code: string;
  message: string;
  field?: string;
  blockingLoadIds?: string[];
  metadata?: Record<string, unknown>;
}

export class AssignmentValidationError extends CustomError {
  statusCode = 422;
  readonly code = 'ASSIGNMENT_BLOCKED';
  readonly blockers: AssignmentBlocker[];

  constructor(message: string, blockers: AssignmentBlocker[]) {
    super(message);
    this.blockers = blockers;
    Object.setPrototypeOf(this, AssignmentValidationError.prototype);
  }

  serializeErrors() {
    return this.blockers.map((blocker) => ({
      message: blocker.message,
      field: blocker.field,
    }));
  }
}

export class UnauthorizedError extends CustomError {
  statusCode = 401;
  readonly code = 'UNAUTHORIZED';

  constructor(public message: string) {
    super(message ?? 'Unauthorized');
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}

export class ForbiddenError extends CustomError {
  statusCode = 403;
  readonly code = 'FORBIDDEN';

  constructor(public message: string) {
    super(message ?? 'Forbidden');
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}

export class OrgSuspendedError extends CustomError {
  statusCode = 403;
  readonly code = 'ORG_SUSPENDED';

  constructor() {
    super('Organization is suspended or inactive');
    Object.setPrototypeOf(this, OrgSuspendedError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}

export class InvalidTransitionError extends CustomError {
  statusCode = 422;
  readonly code = 'INVALID_STATUS_TRANSITION';
  readonly currentStatus: string;
  readonly targetStatus: string;
  readonly allowedTransitions: string[];

  constructor(currentStatus: string, targetStatus: string, allowedTransitions: string[]) {
    super(`Cannot move to ${targetStatus}. Allowed: ${allowedTransitions.join(', ')}`);
    this.currentStatus = currentStatus;
    this.targetStatus = targetStatus;
    this.allowedTransitions = allowedTransitions;
    Object.setPrototypeOf(this, InvalidTransitionError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}

export class OnboardingBlockError extends CustomError {
  statusCode = 422;
  readonly code = 'ONBOARDING_INCOMPLETE';
  readonly missingDocuments: string[];

  constructor(carrierName: string, missingDocuments: string[]) {
    super(`${carrierName} missing: ${missingDocuments.join(', ')}. Complete onboarding first.`);
    this.missingDocuments = missingDocuments;
    Object.setPrototypeOf(this, OnboardingBlockError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}

export class ProhibitedCommodityError extends CustomError {
  statusCode = 422;
  readonly code = 'PROHIBITED_COMMODITY';

  constructor(commodity: string) {
    super(`This commodity is prohibited per company policy: ${commodity}`);
    Object.setPrototypeOf(this, ProhibitedCommodityError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}

export class InsuranceExpiredError extends CustomError {
  statusCode = 422;
  readonly code = 'INSURANCE_EXPIRED';

  constructor(carrierName: string, expiryDate: Date) {
    super(`${carrierName} insurance expired ${expiryDate.toISOString().split('T')[0]}.`);
    Object.setPrototypeOf(this, InsuranceExpiredError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}

export class ConcurrentEditError extends CustomError {
  statusCode = 409;
  readonly code = 'CONCURRENT_EDIT';
  readonly updatedBy: string;
  readonly updatedAt: Date;

  constructor(updatedBy: string, updatedAt: Date) {
    super(`Updated by ${updatedBy} at ${updatedAt.toISOString()}. Please refresh.`);
    this.updatedBy = updatedBy;
    this.updatedAt = updatedAt;
    Object.setPrototypeOf(this, ConcurrentEditError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}

export class SequenceError extends CustomError {
  statusCode = 500;
  readonly code = 'SEQUENCE_ERROR';

  constructor(public message: string) {
    super(message);
    Object.setPrototypeOf(this, SequenceError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}

export class SeatLimitReachedError extends CustomError {
  statusCode = 429;
  readonly code = 'SEAT_LIMIT_REACHED';
  readonly resourceType: 'users' | 'vehicles';
  readonly limit: number;

  constructor(resourceType: 'users' | 'vehicles', limit: number) {
    const label = resourceType === 'users' ? 'team members' : 'vehicles';
    super(`You've reached your plan limit of ${limit} ${label}. Upgrade your plan to add more.`);
    this.resourceType = resourceType;
    this.limit = limit;
    Object.setPrototypeOf(this, SeatLimitReachedError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}

export class LastAdminError extends CustomError {
  statusCode = 409;
  readonly code = 'LAST_ADMIN';

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, LastAdminError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}

export class FieldLockedError extends CustomError {
  statusCode = 422;
  readonly code = 'FIELD_LOCKED';
  readonly field: string;

  constructor(field: string) {
    super(`Field ${field} is locked after dispatch agreement was signed`);
    this.field = field;
    Object.setPrototypeOf(this, FieldLockedError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message, field: this.field }];
  }
}

export const isCustomError = (error: unknown): error is CustomError => error instanceof CustomError;
