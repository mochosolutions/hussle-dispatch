import express from 'express';

import type { RateconWebhookControllers } from '../controllers/rateconWebhookController';

const WEBHOOK_BODY_LIMIT = '20mb';

/**
 * Webhook routes are NOT session-authenticated. The SES route verifies a shared
 * secret header; the Mailpit route is dev-only and gated at mount time. Both use
 * a larger JSON body limit than the global app default (base64 PDFs).
 */
export const createRateconWebhookRoutes = (
  controllers: RateconWebhookControllers,
  options: { enableMailpit: boolean },
): express.Router => {
  const router = express.Router();
  router.use(express.json({ limit: WEBHOOK_BODY_LIMIT }));

  router.post('/ses-inbound', controllers.sesInbound);

  if (options.enableMailpit) {
    router.post('/mailpit-inbound', controllers.mailpitInbound);
  }

  return router;
};
