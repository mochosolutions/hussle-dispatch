import type { Organization } from '../../../types/organizationTypes';

export interface OrganizationResponse {
  organization: Organization;
}

export interface OrganizationListResponse {
  organizations: Organization[];
}

export const toOrganizationResponse = (organization: Organization): OrganizationResponse => ({
  organization,
});

export const toOrganizationListResponse = (
  organizations: Organization[],
): OrganizationListResponse => ({
  organizations,
});
