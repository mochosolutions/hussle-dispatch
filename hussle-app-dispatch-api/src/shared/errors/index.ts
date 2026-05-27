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
  OrgSuspendedError,
  InvalidTransitionError,
  OnboardingBlockError,
  ProhibitedCommodityError,
  InsuranceExpiredError,
  ConcurrentEditError,
  SequenceError,
  SeatLimitReachedError,
  LastAdminError,
  FieldLockedError,
  isCustomError,
} from './commonErrors';

export { AuthRequestError } from './authError';

export { RequestValidationError } from './requestValidationError';

export { GoneError } from './goneError';

export { MissingEstimatedHoursError } from './missingEstimatedHoursError';

export { MissingEnvError } from './missingEnvError';
