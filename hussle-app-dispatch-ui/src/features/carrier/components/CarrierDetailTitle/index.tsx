import { Box, Typography, Chip, Avatar } from '@mui/material';

type CarrierDetailTitleProps = {
  title: string;
  subTitle: string;
} & ({ avatarSrc: string; initials?: never } | { initials: string; avatarSrc?: never });

export const CarrierDetailTitle = ({
  title,
  subTitle,
  avatarSrc,
  initials,
}: CarrierDetailTitleProps) => (
  <>
    <Avatar
      src={avatarSrc}
      sx={{
        width: 36,
        height: 36,
        bgcolor: 'primary.light',
        color: 'primary.main',
        fontWeight: 700,
        fontSize: 14,
      }}
    >
      {initials}
    </Avatar>
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Typography variant="h5">{title}</Typography>
        <Chip label="active" />
      </Box>
      <Typography variant="body2" color="text.secondary">
        {subTitle}
      </Typography>
    </Box>
  </>
);
