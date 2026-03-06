import type { switchOrgService } from '../../../services/auth/switchOrgService';

type SwitchOrgServiceResult = Awaited<ReturnType<typeof switchOrgService>>;

export interface SwitchOrgResponse {
  message: string;
  user: SwitchOrgServiceResult['user'];
  accessibleOrgs: SwitchOrgServiceResult['orgs'];
}

export const toSwitchOrgResponse = (result: SwitchOrgServiceResult): SwitchOrgResponse => ({
  message: 'success',
  user: result.user,
  accessibleOrgs: result.orgs,
});
