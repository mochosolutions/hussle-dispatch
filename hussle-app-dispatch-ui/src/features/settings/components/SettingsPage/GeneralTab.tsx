import { useEffect } from 'react';
import { Box, Chip, Skeleton, Stack } from '@mui/material';
import { MainCard } from '@mocho/ui/components';
import { useSelector, useDispatch } from 'store';
import SectionCard from 'components/SectionCard';
import { SectionHeader } from 'components/SectionHeader';
import { DetailRow, ErrorText } from 'components/Typography';
import { isAdminSelector } from 'features/auth/store/selectors/authSelector';
import { useDrawerActions } from 'features/ui/hooks/useDrawerActions';
import {
  selectSettings,
  selectSettingsLoading,
  selectSettingsError,
} from '../../store/selectors/settingsSelectors';
import { fetchSettingsRequest } from '../../store/reducers/settingsSlice';

const formatCurrency = (value: number): string =>
  `$${Number(value).toLocaleString('en-US')}`;

const SkeletonSection = () => (
  <SectionCard title={<Skeleton width={140} height={18} />}>
    <Stack>
      {[1, 2, 3].map((i) => (
        <Box
          key={i}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            py: 1.25,
            px: 2,
            borderBottom: '1px solid',
            borderColor: 'grey.200',
          }}
        >
          <Skeleton width={120} />
          <Skeleton width={80} />
        </Box>
      ))}
    </Stack>
  </SectionCard>
);

const GeneralTab = () => {
  const dispatch = useDispatch();
  const settings = useSelector(selectSettings);
  const isLoading = useSelector(selectSettingsLoading);
  const error = useSelector(selectSettingsError);
  const isAdmin = useSelector(isAdminSelector);
  const { openDrawer } = useDrawerActions();

  useEffect(() => {
    dispatch(fetchSettingsRequest());
  }, [dispatch]);

  if (isLoading) {
    return (
      <Stack spacing={3} sx={{ maxWidth: 800 }}>
        <SkeletonSection />
        <SkeletonSection />
        <SkeletonSection />
      </Stack>
    );
  }

  return (
    <Stack spacing={3} sx={{ maxWidth: 800 }}>
      {error && (
        <MainCard sx={{ bgcolor: 'error.lighter', borderColor: 'error.light', mb: 2 }}>
          <div role="alert">
            <ErrorText>{error}</ErrorText>
          </div>
        </MainCard>
      )}

      {/* Financial Settings */}
      <SectionCard title="">
        <SectionHeader
          title="Financial Settings"
          onEdit={isAdmin ? () => { openDrawer('settingsFinancial', {}); } : undefined}
        />
        <DetailRow label="Default TONU Fee" value={formatCurrency(settings?.defaultTonuFee ?? 250)} />
        <DetailRow
          label="Default Detention Rate"
          value={`${formatCurrency(settings?.defaultDetentionRate ?? 75)}/hr`}
        />
        <DetailRow label="Detention Free Hours" value={String(settings?.detentionFreeHours ?? 2)} />
        <DetailRow
          label="Min Book Rate Margin"
          value={`${Math.round((settings?.minBookRateProfitMargin ?? 0.15) * 100)}%`}
        />
        <DetailRow
          label="Weekly Gross Target"
          value={formatCurrency(settings?.weeklyGrossTarget ?? 5000)}
          noBorder
        />
      </SectionCard>

      {/* Operations Settings */}
      <SectionCard title="">
        <SectionHeader
          title="Operations Settings"
          onEdit={isAdmin ? () => { openDrawer('settingsOperations', {}); } : undefined}
        />
        <DetailRow label="Default Max Days Out" value={String(settings?.defaultMaxDaysOut ?? 14)} />
        <DetailRow
          label="Chain Depth Threshold"
          value={`${settings?.chainDepthThresholdMiles ?? 250} mi`}
        />
        <DetailRow
          label="Backhaul Search Radius"
          value={`${settings?.backhaulSearchRadiusMiles ?? 150} mi`}
        />
        <DetailRow
          label="Auto Scraping"
          value={settings?.autoScrapingEnabled ? 'Enabled' : 'Disabled'}
        />
        <DetailRow
          label="Prohibited Commodities"
          noBorder
          value={
            settings?.prohibitedCommodities?.length ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'flex-end' }}>
                {settings.prohibitedCommodities.map((c) => (
                  <Chip key={c} label={c} size="small" variant="outlined" />
                ))}
              </Box>
            ) : (
              'None'
            )
          }
        />
      </SectionCard>

      {/* Communication */}
      <SectionCard title="">
        <SectionHeader
          title="Communication"
          onEdit={isAdmin ? () => { openDrawer('settingsCommunication', {}); } : undefined}
        />
        <DetailRow label="Load Intel Email" value={settings?.loadIntelEmailAddress || '—'} />
        <DetailRow label="SES From Email" value={settings?.sesFromEmail || '—'} />
        <DetailRow label="Company Logo URL" value={settings?.companyLogoUrl || '—'} noBorder />
      </SectionCard>

      {/* Driver Communications */}
      <SectionCard title="">
        <SectionHeader
          title="Driver Communications"
          onEdit={isAdmin ? () => { openDrawer('settingsDriverComms', {}); } : undefined}
        />
        <DetailRow
          label="Pre-Pickup Lead"
          value={`${settings?.smsPrePickupLeadMinutes ?? 60} min`}
        />
        <DetailRow
          label="Transit Interval"
          value={`${settings?.smsTransitIntervalMinutes ?? 180} min`}
        />
        <DetailRow
          label="Post-Pickup Escalation"
          value={`${settings?.smsPostPickupEscalationMinutes ?? 30} min`}
        />
        <DetailRow
          label="Cooldown"
          value={`${settings?.smsCooldownMinutes ?? 15} min`}
          noBorder
        />
      </SectionCard>

      {/* Headquarters Location — admin only */}
      {isAdmin && (
        <SectionCard title="">
          <SectionHeader
            title="Headquarters Location"
            onEdit={() => { openDrawer('settingsHeadquarters', {}); }}
          />
          <DetailRow
            label="Latitude"
            value={
              settings?.headquartersLatitude !== null && settings?.headquartersLatitude !== undefined
                ? String(settings.headquartersLatitude)
                : 'Not set'
            }
          />
          <DetailRow
            label="Longitude"
            noBorder
            value={
              settings?.headquartersLongitude !== null &&
              settings?.headquartersLongitude !== undefined
                ? String(settings.headquartersLongitude)
                : 'Not set'
            }
          />
        </SectionCard>
      )}
    </Stack>
  );
};

export default GeneralTab;
