import type { ReactNode } from 'react';
import { Card, CardContent } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

interface MainCardProps {
  children: ReactNode;
  sx?: SxProps<Theme>;
}

/** Standard content card container. */
const MainCard: React.FC<MainCardProps> = ({ children, sx }) => {
  return (
    <Card sx={{ ...sx }}>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

export default MainCard;
