// Engine-level error types. Pure — no imports outside types.ts allowed by purity contract.

export class LockViolationError extends Error {
  readonly stepId: string;
  readonly lockedFields: string[];

  constructor(stepId: string, lockedFields: string[]) {
    super(
      `Cannot back-edit step "${stepId}": fields are locked after signing (${lockedFields.join(', ')})`,
    );
    this.name = 'LockViolationError';
    this.stepId = stepId;
    this.lockedFields = lockedFields;
    Object.setPrototypeOf(this, LockViolationError.prototype);
  }
}
