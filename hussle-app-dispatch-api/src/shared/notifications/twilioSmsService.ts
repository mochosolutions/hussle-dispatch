import type { Logger } from '../utils/logger';
import type { SmsService } from './smsService';

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

/**
 * Twilio implementation of SmsService.
 * Sends real SMS messages via the Twilio REST API.
 */
export const createTwilioSmsService = (
  config: TwilioConfig,
  logger: Logger,
): SmsService => {
  const { accountSid, authToken, fromNumber } = config;
  const baseUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const authHeader = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`;

  return {
    sendSms: async (params) => {
      const body = new URLSearchParams({
        To: params.to,
        From: fromNumber,
        Body: params.body,
      });

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        logger.error('Twilio SMS delivery failed', {
          to: params.to,
          status: response.status,
          error: errorBody,
        });
        throw new Error(`Twilio SMS failed: ${response.status}`);
      }

      const result = await response.json() as { sid: string };
      logger.info('Twilio SMS sent', {
        to: params.to,
        sid: result.sid,
        bodyLength: params.body.length,
      });
    },
  };
};
