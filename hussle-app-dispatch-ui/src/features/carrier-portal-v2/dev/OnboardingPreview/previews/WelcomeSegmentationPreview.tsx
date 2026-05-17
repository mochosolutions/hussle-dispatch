import { useState } from 'react';
import { Box, Divider, Stack } from '@mui/material';
import { LocalShipping, Hub, SyncAlt } from '@mui/icons-material';

import { BodyMuted, KpiLabel, PageTitle } from 'components/Typography';

import PortalShell from '../../../components/PortalShell';
import SegmentationStep from '../../../components/steps/SegmentationStep';
import type { SelectionCardOption } from '../../../components/SelectionCardGrid';

type CarrierType = 'owner_operator' | 'small_fleet' | 'dispatcher_carrier';

const CARRIER_TYPE_OPTIONS: SelectionCardOption<CarrierType>[] = [
  {
    id: 'owner_operator',
    icon: <LocalShipping />,
    title: 'Owner-operator',
    subline: '1 truck, I drive it.',
  },
  {
    id: 'small_fleet',
    icon: <Hub />,
    title: 'Small fleet',
    subline: '2–10 trucks.',
  },
  {
    id: 'dispatcher_carrier',
    icon: <SyncAlt />,
    title: 'Dispatcher-carrier',
    subline: 'I run trucks and dispatch others.',
  },
];

const TITLE = "Welcome aboard. Let's get you running loads.";
const SUBTITLE = (
  <>
    Takes about <strong>15 minutes</strong>. We&apos;ll handle the FMCSA lookup, calculate your
    minimum book rate, and have you ready for dispatch when you&apos;re done.
  </>
);

interface StateFrameProps {
  label: string;
  children: React.ReactNode;
}

const StateFrame: React.FC<StateFrameProps> = ({ label, children }) => (
  <Box sx={{ mb: 4 }}>
    <KpiLabel sx={{ mb: 1.25, display: 'block' }}>{label}</KpiLabel>
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'grey.200',
        borderRadius: 1.5,
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
      }}
    >
      {children}
    </Box>
  </Box>
);

const noop = () => undefined;

const WelcomeSegmentationPreview: React.FC = () => {
  const [interactiveValue, setInteractiveValue] = useState<CarrierType | null>(null);

  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto', p: { xs: 2, md: 4 }, bgcolor: 'grey.200' }}>
      <Box sx={{ mb: 4 }}>
        <KpiLabel>Carrier portal · pre-stepper landing</KpiLabel>
        <PageTitle sx={{ mb: 1 }}>welcome-segmentation</PageTitle>
        <BodyMuted sx={{ fontSize: 13 }}>
          Source: <code>docs/screenshots/mockups/onboarding/welcome-segmentation.html</code>
        </BodyMuted>
      </Box>

      <StateFrame label="State A · default · nothing selected">
        <PortalShell>
          <SegmentationStep<CarrierType>
            eyebrow="Invited by Jared at FleetCommand"
            title={TITLE}
            subtitle={SUBTITLE}
            question={{
              label: 'How do you operate?',
              required: true,
              options: CARRIER_TYPE_OPTIONS,
            }}
            value={null}
            onChange={noop}
            onContinue={noop}
          />
        </PortalShell>
      </StateFrame>

      <StateFrame label='State B · "Owner-operator" selected · continue enabled'>
        <PortalShell>
          <SegmentationStep<CarrierType>
            eyebrow="Invited by Jared at FleetCommand"
            title={TITLE}
            subtitle={SUBTITLE}
            question={{
              label: 'How do you operate?',
              required: true,
              options: CARRIER_TYPE_OPTIONS,
            }}
            value="owner_operator"
            onChange={noop}
            onContinue={noop}
          />
        </PortalShell>
      </StateFrame>

      <StateFrame label='State C · "Small fleet" selected'>
        <PortalShell>
          <SegmentationStep<CarrierType>
            eyebrow="Invited by Jared at FleetCommand"
            title={TITLE}
            subtitle={SUBTITLE}
            question={{
              label: 'How do you operate?',
              required: true,
              options: CARRIER_TYPE_OPTIONS,
            }}
            value="small_fleet"
            onChange={noop}
            onContinue={noop}
          />
        </PortalShell>
      </StateFrame>

      <StateFrame label='State D · "Dispatcher-carrier" selected'>
        <PortalShell>
          <SegmentationStep<CarrierType>
            eyebrow="Invited by Jared at FleetCommand"
            title={TITLE}
            subtitle={SUBTITLE}
            question={{
              label: 'How do you operate?',
              required: true,
              options: CARRIER_TYPE_OPTIONS,
            }}
            value="dispatcher_carrier"
            onChange={noop}
            onContinue={noop}
          />
        </PortalShell>
      </StateFrame>

      <StateFrame label="State E · unknown inviter · generic eyebrow">
        <PortalShell>
          <SegmentationStep<CarrierType>
            eyebrow="Invited to FleetCommand"
            title={TITLE}
            subtitle={SUBTITLE}
            question={{
              label: 'How do you operate?',
              required: true,
              options: CARRIER_TYPE_OPTIONS,
            }}
            value={null}
            onChange={noop}
            onContinue={noop}
          />
        </PortalShell>
      </StateFrame>

      <Divider sx={{ my: 5 }} />

      <Stack spacing={1.25} sx={{ mb: 2 }}>
        <KpiLabel>State F · interactive · click cards</KpiLabel>
        <BodyMuted sx={{ fontSize: 13 }}>
          Selected:{' '}
          <Box component="code" sx={{ bgcolor: 'grey.100', px: 0.75, borderRadius: 0.5 }}>
            {interactiveValue ?? 'null'}
          </Box>
        </BodyMuted>
      </Stack>
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'grey.200',
          borderRadius: 1.5,
          overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
        }}
      >
        <PortalShell>
          <SegmentationStep<CarrierType>
            eyebrow="Invited by Jared at FleetCommand"
            title={TITLE}
            subtitle={SUBTITLE}
            question={{
              label: 'How do you operate?',
              required: true,
              options: CARRIER_TYPE_OPTIONS,
            }}
            value={interactiveValue}
            onChange={setInteractiveValue}
            onContinue={() => {
              // eslint-disable-next-line no-console
              console.log('Continue clicked with', interactiveValue);
            }}
          />
        </PortalShell>
      </Box>
    </Box>
  );
};

export default WelcomeSegmentationPreview;
