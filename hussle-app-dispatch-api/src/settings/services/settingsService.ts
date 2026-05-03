import type { OrgSettings } from '@prisma/client';
import type { Decimal } from '@prisma/client/runtime/library';
import { ValidationError } from '@/shared/errors';
import type {
  OrganizationHq,
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

const DEFAULT_SETTINGS: Omit<
  OrgSettingsResponse,
  'id' | 'organizationId' | 'headquartersLatitude' | 'headquartersLongitude'
> = {
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
  smsPrePickupLeadMinutes: 60,
  smsTransitIntervalMinutes: 180,
  smsPostPickupEscalationMinutes: 30,
  smsCooldownMinutes: 15,
};

const decimalToNumber = (value: Decimal | null): number | null => {
  if (value === null) {
    return null;
  }
  return value.toNumber();
};

const toResponse = (
  settings: OrgSettings,
  hq: OrganizationHq | null,
): OrgSettingsResponse => ({
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
  smsPrePickupLeadMinutes: settings.smsPrePickupLeadMinutes,
  smsTransitIntervalMinutes: settings.smsTransitIntervalMinutes,
  smsPostPickupEscalationMinutes: settings.smsPostPickupEscalationMinutes,
  smsCooldownMinutes: settings.smsCooldownMinutes,
  headquartersLatitude: hq !== null ? decimalToNumber(hq.headquartersLatitude) : null,
  headquartersLongitude: hq !== null ? decimalToNumber(hq.headquartersLongitude) : null,
});

export const createSettingsService = (deps: SettingsServiceDeps): SettingsService => ({
  getSettings: async (organizationId: string): Promise<OrgSettingsResponse> => {
    const [settings, hq] = await Promise.all([
      deps.settingsRepository.findByOrganizationId(organizationId),
      deps.settingsRepository.getOrganizationHq(organizationId),
    ]);

    if (settings === null) {
      return {
        id: '',
        organizationId,
        ...DEFAULT_SETTINGS,
        headquartersLatitude: hq !== null ? decimalToNumber(hq.headquartersLatitude) : null,
        headquartersLongitude: hq !== null ? decimalToNumber(hq.headquartersLongitude) : null,
      };
    }

    return toResponse(settings, hq);
  },

  updateSettings: async (input: UpdateSettingsInput): Promise<OrgSettingsResponse> => {
    const { organizationId, headquartersLatitude, headquartersLongitude, ...data } = input;

    const latProvided = headquartersLatitude !== undefined;
    const lngProvided = headquartersLongitude !== undefined;

    if (latProvided !== lngProvided) {
      throw new ValidationError(
        'headquartersLatitude and headquartersLongitude must be set together or both null',
      );
    }

    if (latProvided && lngProvided) {
      const latIsNull = headquartersLatitude === null;
      const lngIsNull = headquartersLongitude === null;
      if (latIsNull !== lngIsNull) {
        throw new ValidationError(
          'headquartersLatitude and headquartersLongitude must be set together or both null',
        );
      }

      await deps.settingsRepository.updateOrganizationHq(organizationId, {
        headquartersLatitude: headquartersLatitude ?? null,
        headquartersLongitude: headquartersLongitude ?? null,
      });
    }

    const settings = await deps.settingsRepository.upsert(organizationId, data);
    const hq = await deps.settingsRepository.getOrganizationHq(organizationId);

    return toResponse(settings, hq);
  },
});
