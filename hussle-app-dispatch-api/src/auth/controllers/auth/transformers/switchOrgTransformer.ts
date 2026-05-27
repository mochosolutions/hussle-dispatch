import type { switchOrgService } from '../../../services/auth/switchOrgService';

type SwitchOrgServiceResult = Awaited<ReturnType<typeof switchOrgService>>;

export interface SwitchOrgResponse {
  message: string;
  user: SwitchOrgServiceResult['user'];
  accessibleOrgs: SwitchOrgServiceResult['orgs'];
  accessTokenExpiresAt: string;
}

export const toSwitchOrgResponse = (
  result: SwitchOrgServiceResult,
  accessTokenExpiresAt: string
): SwitchOrgResponse => ({
  message: 'success',
  user: result.user,
  accessibleOrgs: result.orgs,
  accessTokenExpiresAt,
});
