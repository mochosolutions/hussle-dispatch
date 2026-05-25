/**
 * Port for writing the agreement-signed projection onto the Carrier row.
 *
 * Idempotency: implementations MUST skip the write if `signedAgreementId` is
 * already populated (the agreement.signed event handler is at-least-once).
 */
export interface CarrierAgreementWritePort {
  setSignedAgreementId(carrierId: string, agreementId: string): Promise<void>;
  /**
   * Clear the agreement-signed projection. Used by the void-for-resign flow
   * when a carrier changes an identity field bound to a signed agreement —
   * the agreement is voided and the carrier returns to the signing step.
   */
  clearSignedAgreement(carrierId: string): Promise<void>;
}
