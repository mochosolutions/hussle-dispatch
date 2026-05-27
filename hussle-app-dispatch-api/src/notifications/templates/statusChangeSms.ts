import type { StatusChangeContext } from '../types/notificationTypes';

export const statusChangeSmsBody = (ctx: StatusChangeContext): string => {
  const base = `Load ${ctx.loadNumber}: ${ctx.fromStatus ?? 'N/A'} → ${ctx.toStatus}`;
  const tracking = ctx.trackingUrl !== null ? ` Track: ${ctx.trackingUrl}` : '';
  return `${base}${tracking}`;
};
