import type { CheckCallContext } from '../types/notificationTypes';

export const checkCallEmailSubject = (ctx: CheckCallContext): string =>
  `Load ${ctx.loadNumber} — Check Call Update`;

export const checkCallEmailHtml = (ctx: CheckCallContext): string => {
  const trackingLink = ctx.trackingUrl !== null
    ? `<p><a href="${ctx.trackingUrl}">Track this load</a></p>`
    : '';

  const rows: string[] = [];

  if (ctx.location !== null) {
    rows.push(`
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Location</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${ctx.location}</td>
    </tr>`);
  }

  if (ctx.status !== null) {
    rows.push(`
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Status</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${ctx.status}</td>
    </tr>`);
  }

  if (ctx.eta !== null) {
    rows.push(`
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">ETA</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${ctx.eta}</td>
    </tr>`);
  }

  return `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Check Call Update</h2>
  <p>A check call has been logged for load <strong>${ctx.loadNumber}</strong>.</p>
  <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
    ${rows.join('')}
  </table>
  ${trackingLink}
  <p style="color: #666; font-size: 12px;">This is an automated notification from your dispatch system.</p>
</div>`.trim();
};
