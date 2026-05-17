import { Box } from '@mui/material';

const FieldDivider: React.FC = () => {
  return (
    <Box
      aria-hidden
      sx={{
        gridColumn: '1 / -1',
        height: '1px',
        bgcolor: 'grey.200',
        my: 0.75,
      }}
    />
  );
};

export default FieldDivider;
