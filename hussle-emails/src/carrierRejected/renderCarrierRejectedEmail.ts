import { render } from '@react-email/components';
import CarrierRejectedEmail from './CarrierRejectedEmail';

export interface CarrierRejectedEmailData {
  carrierName: string;
  organizationName: string;
  rejectionReason: string;
}

export const renderCarrierRejectedEmail = async (
  data: CarrierRejectedEmailData,
): Promise<{ subject: string; html: string }> => ({
  subject: `Update on your application with ${data.organizationName}`,
  html: await render(CarrierRejectedEmail(data)),
});
