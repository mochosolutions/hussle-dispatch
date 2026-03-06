import type { Request } from 'express';
import type {
  OrganizationRole,
  OrganizationStatus,
  OrganizationVertical,
  SubscriptionTier,
} from '@prisma/client';
import type { Organization } from '../../../types/organizationTypes';

interface UpdateOrganizationPayload {
  organizationId: string;
  data: Partial<Organization>;
}

interface UpdateOrganizationBody {
  name?: string;
  slug?: string;
  email?: string;
  role?: OrganizationRole;
  vertical?: OrganizationVertical;
  subscriptionTier?: SubscriptionTier;
  status?: OrganizationStatus;
  website?: string;
  description?: string;
  logo?: string;
  phoneNumber?: string;
  address?: string;
}

export const updateOrganizationMapper = (req: Request): UpdateOrganizationPayload => {
  const organizationId = req.params.organizationId ?? '';
  const {
    name,
    slug,
    email,
    role,
    vertical,
    subscriptionTier,
    status,
    website,
    description,
    logo,
    phoneNumber,
    address,
  } = req.body as UpdateOrganizationBody;

  return {
    organizationId,
    data: {
      ...(name && { name }),
      ...(slug && { slug }),
      ...(email && { email: email.toLowerCase() }),
      ...(role && { role }),
      ...(vertical && { vertical }),
      ...(subscriptionTier && { subscriptionTier }),
      ...(status && { status }),
      ...(website && { website }),
      ...(description && { description }),
      ...(logo && { logo }),
      ...(phoneNumber && { phoneNumber }),
      ...(address && { address }),
    },
  };
};
