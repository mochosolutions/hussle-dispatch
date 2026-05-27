import { CustomError } from '@mocho/common';

export interface MissingEstimatedHoursLoad {
  id: string;
  loadNumber: string;
}

/**
 * Thrown when a PER_HOUR driver settlement is requested but one or more
 * in-scope loads are missing the estimatedHours value required to compute
 * driver pay.
 */
export class MissingEstimatedHoursError extends CustomError {
  statusCode = 400;
  readonly code = 'MISSING_ESTIMATED_HOURS';
  readonly loads: MissingEstimatedHoursLoad[];
  readonly loadIds: string[];

  constructor(loads: MissingEstimatedHoursLoad[]) {
    super(
      `Cannot generate settlement: ${loads.length} PER_HOUR load(s) missing estimatedHours`,
    );
    this.loads = loads;
    this.loadIds = loads.map((load) => load.id);
    Object.setPrototypeOf(this, MissingEstimatedHoursError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}
