import { render } from '@react-email/components';
import CheckCallEmail from './CheckCallEmail';

export interface CheckCallEmailData {
  loadNumber: string;
  location: string | null;
  status: string | null;
  eta: string | null;
  trackingUrl: string | null;
}

export const renderCheckCallEmail = async (
  data: CheckCallEmailData,
): Promise<{ subject: string; html: string }> => ({
  subject: `Check Call — Load ${data.loadNumber}`,
  html: await render(CheckCallEmail(data)),
});
