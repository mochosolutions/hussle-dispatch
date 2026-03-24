/**
 * SMS service interface.
 * Implementations: consoleSmsService (dev), SNS (future production).
 */
export interface SmsService {
  sendSms(params: {
    to: string;
    body: string;
  }): Promise<void>;
}
