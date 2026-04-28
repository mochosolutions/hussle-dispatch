import type { DocumentUploadedContext } from '../types/notificationTypes';

export const documentUploadedSmsBody = (ctx: DocumentUploadedContext): string => {
  const base = `Load ${ctx.loadNumber}: ${ctx.documentType} uploaded.`;
  const tracking = ctx.trackingUrl !== null ? ` Track: ${ctx.trackingUrl}` : '';
  return `${base}${tracking}`;
};
