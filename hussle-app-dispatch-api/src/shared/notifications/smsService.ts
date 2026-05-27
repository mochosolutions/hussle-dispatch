/**
 * SMS service interface.
 * Implementations: consoleSmsService (dev), SNS (future production).
 */

export interface SmsSendResult {
  /**
   * Provider-assigned message id for the sent SMS.
   * Null for backends that do not expose one (e.g. the console backend).
   */
  messageSid: string | null;
}

export interface SmsService {
  sendSms(params: { to: string; body: string }): Promise<SmsSendResult>;
}
