/**
 * Central export point for all domain error classes.
 * Each extends CustomError from @mocho/common.
 */

export {
  NotFoundError,
  ValidationError,
  ConflictError,
  ActiveLoadsConflictError,
  AssignmentValidationError,
  UnauthorizedError,
  ForbiddenError,
  InvalidTransitionError,
  OnboardingBlockError,
  ProhibitedCommodityError,
  InsuranceExpiredError,
  ConcurrentEditError,
  OwnerOperatorNotSupportedError,
  SequenceError,
  SeatLimitReachedError,
  LastAdminError,
  isCustomError,
} from './commonErrors';

export { AuthRequestError } from './authError';

export { RequestValidationError } from './requestValidationError';

export { GoneError } from './goneError';
