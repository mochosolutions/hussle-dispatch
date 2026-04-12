import { render } from '@react-email/components';
import CarrierApprovedEmail from './CarrierApprovedEmail';

export interface CarrierApprovedEmailData {
  carrierName: string;
  organizationName: string;
}

export const renderCarrierApprovedEmail = async (
  data: CarrierApprovedEmailData,
): Promise<{ subject: string; html: string }> => ({
  subject: `Welcome to ${data.organizationName}!`,
  html: await render(CarrierApprovedEmail(data)),
});
