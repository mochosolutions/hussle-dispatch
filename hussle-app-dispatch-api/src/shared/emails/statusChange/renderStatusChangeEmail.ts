import { render } from '@react-email/components';
import StatusChangeEmail from './StatusChangeEmail';

export interface StatusChangeEmailData {
  loadNumber: string;
  fromStatus: string | null;
  toStatus: string;
  trackingUrl: string | null;
}

export const renderStatusChangeEmail = async (
  data: StatusChangeEmailData,
): Promise<{ subject: string; html: string }> => ({
  subject: `Load ${data.loadNumber} — Status changed to ${data.toStatus}`,
  html: await render(StatusChangeEmail(data)),
});
