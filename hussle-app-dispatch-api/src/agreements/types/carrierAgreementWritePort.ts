/**
 * Port for writing the agreement-signed projection onto the Carrier row.
 *
 * Idempotency: implementations MUST skip the write if `signedAgreementId` is
 * already populated (the agreement.signed event handler is at-least-once).
 */
export interface CarrierAgreementWritePort {
  setSignedAgreementId(carrierId: string, agreementId: string): Promise<void>;
}
