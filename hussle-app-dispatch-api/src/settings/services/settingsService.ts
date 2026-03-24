import type { OrgSettings } from '@prisma/client';
import type {
  OrgSettingsResponse,
  SettingsRepoPort,
  UpdateSettingsInput,
} from '../types/settingsTypes';

interface SettingsServiceDeps {
  settingsRepository: SettingsRepoPort;
}

export interface SettingsService {
  getSettings(organizationId: string): Promise<OrgSettingsResponse>;
  updateSettings(input: UpdateSettingsInput): Promise<OrgSettingsResponse>;
}

const DEFAULT_SETTINGS: Omit<OrgSettingsResponse, 'id' | 'organizationId'> = {
  defaultTonuFee: 250.0,
  prohibitedCommodities: ['garbage', 'refuse', 'recyclables', 'dirty recyclables'],
  weeklyGrossTarget: 5000.0,
  defaultDetentionRate: 25.0,
  detentionFreeHours: 2,
  minBookRateProfitMargin: 0.15,
  defaultMaxDaysOut: 5,
  chainDepthThresholdMiles: 500,
  backhaulSearchRadiusMiles: 50,
  autoScrapingEnabled: true,
  loadIntelEmailAddress: null,
  sesFromEmail: null,
  companyLogoUrl: null,
};

const toResponse = (settings: OrgSettings): OrgSettingsResponse => ({
  id: settings.id,
  organizationId: settings.organizationId,
  defaultTonuFee: Number(settings.defaultTonuFee),
  prohibitedCommodities: settings.prohibitedCommodities,
  weeklyGrossTarget: Number(settings.weeklyGrossTarget),
  defaultDetentionRate: Number(settings.defaultDetentionRate),
  detentionFreeHours: settings.detentionFreeHours,
  minBookRateProfitMargin: Number(settings.minBookRateProfitMargin),
  defaultMaxDaysOut: settings.defaultMaxDaysOut,
  chainDepthThresholdMiles: settings.chainDepthThresholdMiles,
  backhaulSearchRadiusMiles: settings.backhaulSearchRadiusMiles,
  autoScrapingEnabled: settings.autoScrapingEnabled,
  loadIntelEmailAddress: settings.loadIntelEmailAddress,
  sesFromEmail: settings.sesFromEmail,
  companyLogoUrl: settings.companyLogoUrl,
});

export const createSettingsService = (deps: SettingsServiceDeps): SettingsService => ({
  getSettings: async (organizationId: string): Promise<OrgSettingsResponse> => {
    const settings = await deps.settingsRepository.findByOrganizationId(organizationId);

    if (settings === null) {
      return {
        id: '',
        organizationId,
        ...DEFAULT_SETTINGS,
      };
    }

    return toResponse(settings);
  },

  updateSettings: async (input: UpdateSettingsInput): Promise<OrgSettingsResponse> => {
    const { organizationId, ...data } = input;
    const settings = await deps.settingsRepository.upsert(organizationId, data);

    return toResponse(settings);
  },
});
