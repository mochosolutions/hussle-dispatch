import { render } from '@react-email/components';
import CarrierInviteEmail from './CarrierInviteEmail';
import type { RequiredCarrierDocument } from '@/shared/constants/requiredCarrierDocuments';

export interface CarrierInviteEmailData {
  carrierName: string;
  organizationName: string;
  portalUrl: string;
  documents: readonly RequiredCarrierDocument[];
  message?: string;
}

export const renderCarrierInviteEmail = async (
  data: CarrierInviteEmailData,
): Promise<{ subject: string; html: string }> => ({
  subject: `You've been invited to onboard with ${data.organizationName}`,
  html: await render(CarrierInviteEmail(data)),
});
