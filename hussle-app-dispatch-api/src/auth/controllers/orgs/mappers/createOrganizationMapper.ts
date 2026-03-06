import type { Request } from 'express';
import type { CreateOrganizationInput } from '../../../types/organizationTypes';

export const createOrganizationMapper = (req: Request): CreateOrganizationInput => {
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
  } = req.body as {
    name: string;
    slug: string;
    email: string;
    role: string;
    vertical?: string;
    subscriptionTier?: string;
    status?: string;
    website?: string;
    description?: string;
    logo?: string;
    phoneNumber?: string;
    address?: string;
  };

  return {
    name,
    slug: slug.toLowerCase(),
    email: email.toLowerCase(),
    role,
    vertical,
    subscriptionTier,
    status,
    website,
    description,
    logo,
    phoneNumber,
    address,
  };
};
