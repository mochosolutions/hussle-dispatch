import type { StatusChangeContext } from '../types/notificationTypes';

export const statusChangeEmailSubject = (ctx: StatusChangeContext): string =>
  `Load ${ctx.loadNumber} — Status Update: ${ctx.toStatus}`;

export const statusChangeEmailHtml = (ctx: StatusChangeContext): string => {
  const trackingLink = ctx.trackingUrl !== null
    ? `<p><a href="${ctx.trackingUrl}">Track this load</a></p>`
    : '';

  return `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Load Status Update</h2>
  <p>Load <strong>${ctx.loadNumber}</strong> has been updated.</p>
  <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Previous Status</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${ctx.fromStatus ?? 'N/A'}</td>
    </tr>
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">New Status</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${ctx.toStatus}</td>
    </tr>
  </table>
  ${trackingLink}
  <p style="color: #666; font-size: 12px;">This is an automated notification from your dispatch system.</p>
</div>`.trim();
};
