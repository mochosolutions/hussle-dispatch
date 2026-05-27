import type { OrgSettings } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { ValidationError } from '@/shared/errors';
import { createSettingsService } from '../settingsService';
import type { SettingsRepoPort } from '../../types/settingsTypes';

const ORG_ID = 'org-1';

const buildOrgSettings = (overrides: Partial<OrgSettings> = {}): OrgSettings => ({
  id: 'settings-1',
  organizationId: ORG_ID,
  defaultTonuFee: new Decimal(250),
  prohibitedCommodities: ['garbage'],
  weeklyGrossTarget: new Decimal(5000),
  defaultDetentionRate: new Decimal(25),
  detentionFreeHours: 2,
  minBookRateProfitMargin: new Decimal(0.15),
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
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
}) as OrgSettings;

const createMockRepo = (): jest.Mocked<SettingsRepoPort> => ({
  findByOrganizationId: jest.fn(),
  upsert: jest.fn(),
  getOrganizationHq: jest.fn(),
  updateOrganizationHq: jest.fn(),
});

describe('settingsService', () => {
  let mockRepo: jest.Mocked<SettingsRepoPort>;
  let service: ReturnType<typeof createSettingsService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = createMockRepo();
    service = createSettingsService({ settingsRepository: mockRepo });
  });

  describe('getSettings', () => {
    it('returns headquarters as null when org has no HQ set', async () => {
      // Arrange
      mockRepo.findByOrganizationId.mockResolvedValue(buildOrgSettings());
      mockRepo.getOrganizationHq.mockResolvedValue({
        headquartersLatitude: null,
        headquartersLongitude: null,
      });

      // Act
      const result = await service.getSettings(ORG_ID);

      // Assert
      expect(result.headquartersLatitude).toBeNull();
      expect(result.headquartersLongitude).toBeNull();
    });

    it('returns headquarters values when set', async () => {
      // Arrange
      mockRepo.findByOrganizationId.mockResolvedValue(buildOrgSettings());
      mockRepo.getOrganizationHq.mockResolvedValue({
        headquartersLatitude: new Decimal('32.776665'),
        headquartersLongitude: new Decimal('-96.796989'),
      });

      // Act
      const result = await service.getSettings(ORG_ID);

      // Assert
      expect(result.headquartersLatitude).toBeCloseTo(32.776665, 5);
      expect(result.headquartersLongitude).toBeCloseTo(-96.796989, 5);
    });

    it('returns defaults with HQ from org when settings row is missing', async () => {
      // Arrange
      mockRepo.findByOrganizationId.mockResolvedValue(null);
      mockRepo.getOrganizationHq.mockResolvedValue({
        headquartersLatitude: new Decimal('40.0'),
        headquartersLongitude: new Decimal('-100.0'),
      });

      // Act
      const result = await service.getSettings(ORG_ID);

      // Assert
      expect(result.id).toBe('');
      expect(result.headquartersLatitude).toBe(40);
      expect(result.headquartersLongitude).toBe(-100);
    });
  });

  describe('updateSettings', () => {
    it('writes both HQ values to the organization row', async () => {
      // Arrange
      mockRepo.upsert.mockResolvedValue(buildOrgSettings());
      mockRepo.getOrganizationHq.mockResolvedValue({
        headquartersLatitude: new Decimal('32.5'),
        headquartersLongitude: new Decimal('-96.5'),
      });
      mockRepo.updateOrganizationHq.mockResolvedValue(undefined);

      // Act
      await service.updateSettings({
        organizationId: ORG_ID,
        headquartersLatitude: 32.5,
        headquartersLongitude: -96.5,
      });

      // Assert
      expect(mockRepo.updateOrganizationHq).toHaveBeenCalledWith(ORG_ID, {
        headquartersLatitude: 32.5,
        headquartersLongitude: -96.5,
      });
    });

    it('throws ValidationError when only headquartersLatitude is supplied', async () => {
      mockRepo.upsert.mockResolvedValue(buildOrgSettings());

      await expect(
        service.updateSettings({
          organizationId: ORG_ID,
          headquartersLatitude: 32.5,
        }),
      ).rejects.toBeInstanceOf(ValidationError);

      expect(mockRepo.updateOrganizationHq).not.toHaveBeenCalled();
    });

    it('throws ValidationError when only headquartersLongitude is supplied', async () => {
      mockRepo.upsert.mockResolvedValue(buildOrgSettings());

      await expect(
        service.updateSettings({
          organizationId: ORG_ID,
          headquartersLongitude: -96.5,
        }),
      ).rejects.toBeInstanceOf(ValidationError);

      expect(mockRepo.updateOrganizationHq).not.toHaveBeenCalled();
    });

    it('throws ValidationError when one is null and the other is a number', async () => {
      mockRepo.upsert.mockResolvedValue(buildOrgSettings());

      await expect(
        service.updateSettings({
          organizationId: ORG_ID,
          headquartersLatitude: null,
          headquartersLongitude: -96.5,
        }),
      ).rejects.toBeInstanceOf(ValidationError);

      expect(mockRepo.updateOrganizationHq).not.toHaveBeenCalled();
    });

    it('clears the org HQ when both are null', async () => {
      // Arrange
      mockRepo.upsert.mockResolvedValue(buildOrgSettings());
      mockRepo.getOrganizationHq.mockResolvedValue({
        headquartersLatitude: null,
        headquartersLongitude: null,
      });
      mockRepo.updateOrganizationHq.mockResolvedValue(undefined);

      // Act
      await service.updateSettings({
        organizationId: ORG_ID,
        headquartersLatitude: null,
        headquartersLongitude: null,
      });

      // Assert
      expect(mockRepo.updateOrganizationHq).toHaveBeenCalledWith(ORG_ID, {
        headquartersLatitude: null,
        headquartersLongitude: null,
      });
    });

    it('does not call updateOrganizationHq when neither HQ field is provided', async () => {
      // Arrange
      mockRepo.upsert.mockResolvedValue(buildOrgSettings());
      mockRepo.getOrganizationHq.mockResolvedValue({
        headquartersLatitude: null,
        headquartersLongitude: null,
      });

      // Act
      await service.updateSettings({
        organizationId: ORG_ID,
        defaultTonuFee: 300,
      });

      // Assert
      expect(mockRepo.updateOrganizationHq).not.toHaveBeenCalled();
      expect(mockRepo.upsert).toHaveBeenCalledTimes(1);
    });
  });
});
