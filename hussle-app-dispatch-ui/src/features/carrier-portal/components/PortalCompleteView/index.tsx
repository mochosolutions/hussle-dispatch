import { Box, Paper, Stack } from '@mui/material';
import { CheckCircle, BoltOutlined } from '@mui/icons-material';

import { useSelector } from 'store';

import { Body, BodyMuted, KpiLabel, PageTitle, SectionTitle } from 'components/Typography';

import { selectCarrier } from '../../store/selectors/portalSelectors';

const PHASES = ['Company', 'Equipment', 'Drivers', 'Cost Analysis', 'Lane Preferences', 'Documents'];

const PortalCompleteView: React.FC = () => {
  const carrier = useSelector(selectCarrier);
  const name = carrier?.name ?? 'Carrier';

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Box sx={{ maxWidth: 640, width: '100%', textAlign: 'center' }}>
        <Box
          sx={{
            width: 88,
            height: 88,
            borderRadius: '50%',
            bgcolor: 'success.light',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
          }}
        >
          <CheckCircle sx={{ fontSize: 48, color: 'success.main' }} />
        </Box>

        <PageTitle sx={{ mb: 1.5 }}>You&apos;re submitted, {name}.</PageTitle>
        <Body sx={{ color: 'text.secondary', mb: 4 }}>
          Your onboarding is complete. Your dispatcher will review your application and activate
          your account — usually within a few hours. You&apos;ll get a text when you&apos;re live.
        </Body>

        <Paper
          elevation={0}
          sx={{ p: 3, borderRadius: 2, border: 1, borderColor: 'divider', textAlign: 'left', mb: 3 }}
        >
          <KpiLabel sx={{ mb: 2 }}>WHAT YOU COMPLETED</KpiLabel>
          <Stack spacing={1.5}>
            {PHASES.map((phase) => (
              <Box key={phase} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CheckCircle sx={{ fontSize: 18, color: 'success.main' }} />
                <Body>{phase}</Body>
              </Box>
            ))}
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            border: 1,
            borderColor: 'warning.light',
            bgcolor: 'rgba(255, 167, 38, 0.08)',
            textAlign: 'left',
            display: 'flex',
            gap: 2,
            alignItems: 'flex-start',
          }}
        >
          <BoltOutlined sx={{ color: 'warning.main', mt: 0.25 }} />
          <Box>
            <SectionTitle sx={{ fontSize: 14, mb: 0.5 }}>One thing to do after activation</SectionTitle>
            <BodyMuted>
              Your dispatcher will schedule a quick cost analysis review with you. This takes 15
              minutes and builds a full expense profile so your minimum rate is as accurate as
              possible.
            </BodyMuted>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default PortalCompleteView;
