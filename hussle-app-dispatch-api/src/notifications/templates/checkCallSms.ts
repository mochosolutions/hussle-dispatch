import type { CheckCallContext } from '../types/notificationTypes';

export const checkCallSmsBody = (ctx: CheckCallContext): string => {
  const parts = [`Load ${ctx.loadNumber} check call`];

  if (ctx.location !== null) {
    parts.push(`at ${ctx.location}`);
  }

  if (ctx.eta !== null) {
    parts.push(`ETA: ${ctx.eta}`);
  }

  if (ctx.trackingUrl !== null) {
    parts.push(`Track: ${ctx.trackingUrl}`);
  }

  return parts.join('. ');
};
