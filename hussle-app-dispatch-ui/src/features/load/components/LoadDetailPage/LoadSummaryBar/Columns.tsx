import { Box, Stack } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import { BodyStrong, BodyMuted, KpiLabel, LinkText } from 'components/Typography';
import { SummaryStopInfo } from '../../../types';

const LABEL_SX = { minWidth: 70, flexShrink: 0 } as const;

export const StopColumn: React.FC<{
  icon: React.ReactNode;
  label: string;
  stop: SummaryStopInfo;
}> = ({ icon, label, stop }) => (
  <>
    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
      {icon}
      <KpiLabel>{label}</KpiLabel>
    </Stack>

    <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, alignItems: 'center' }}>
      <BodyMuted sx={LABEL_SX}>Facility:</BodyMuted>
      <BodyStrong sx={{ lineHeight: 1.3 }}>{stop.facilityName || '-'}</BodyStrong>
    </Box>

    <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, alignItems: 'center' }}>
      <BodyMuted sx={LABEL_SX}>Location:</BodyMuted>
      <BodyStrong sx={{ lineHeight: 1.3 }}>{stop.cityState || '-'}</BodyStrong>
    </Box>

    <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, alignItems: 'center' }}>
      <BodyMuted sx={LABEL_SX}>Date:</BodyMuted>
      <Stack direction="row" spacing={0.5} alignItems="center">
        {stop.isCompleted && <CheckCircleIcon sx={{ fontSize: 12, color: 'success.main' }} />}
        <BodyStrong sx={{ lineHeight: 1.3 }}>{stop.dateTime || '-'}</BodyStrong>
      </Stack>
    </Box>
  </>
);

export const ShipmentColumn: React.FC<{
  Icon: React.ReactNode;
  columnLabel: string;
  values: {
    label: string;
    value: string;
    link?: string;
  }[];
}> = ({ Icon, columnLabel, values }) => {
  const navigate = useNavigate();

  return (
    <>
      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
        {Icon}
        <KpiLabel>{columnLabel}</KpiLabel>
      </Stack>
      {values.map(({ value, label, link }, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            width: '100%',
            gap: 0.5,
            mb: 0.5,
          }}
        >
          <BodyMuted sx={LABEL_SX}>{label}:</BodyMuted>

          {link ? (
            <LinkText
              sx={{
                lineHeight: 1.3,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
              onClick={() => {
                navigate(link);
              }}
            >
              {value}
            </LinkText>
          ) : (
            <BodyStrong sx={{ lineHeight: 1.3, textTransform: 'capitalize' }}>{value}</BodyStrong>
          )}
        </Box>
      ))}
    </>
  );
};
