import type { ReactNode } from 'react';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery, Box } from '@mui/material';
import DrawerHeaderStyled from './DrawerHeaderStyled';
import useConfig from '../../../../../hooks/useConfig';
import { MenuOrientation } from '../../../../../types/config';

interface Props {
  open: boolean;
  logo?: ReactNode | string;
  logoIcon?: ReactNode | string;
  styles?: Record<string, unknown>;
}

const DrawerHeader = ({ open, logo, logoIcon, styles }: Props) => {
  const theme = useTheme();
  const downLG = useMediaQuery(theme.breakpoints.down('lg'));

  const { menuOrientation } = useConfig();
  const isHorizontal = menuOrientation === MenuOrientation.HORIZONTAL && !downLG;

  const headerStyles = {
    minHeight: isHorizontal ? 'unset' : '60px',
    // width: isHorizontal ? { xs: '100%', lg: '424px' } : 'inherit',
    // paddingTop: isHorizontal ? { xs: '10px', lg: '0' } : '8px',
    // paddingBottom: isHorizontal ? { xs: '18px', lg: '0' } : '8px',
    // paddingLeft: isHorizontal ? { xs: '24px', lg: '0' } : open ? '24px' : 0,
    ...(styles ?? {}),
  };

  const renderLogo = () => {
    if (!open && logoIcon) {
      if (typeof logoIcon === 'string') {
        return (
          <Box
            component="img"
            src={logoIcon}
            sx={{ height: 32, width: 'auto', objectFit: 'contain' }}
          />
        );
      }
      return logoIcon;
    }
    if (logo) {
      if (typeof logo === 'string') {
        return (
          <Box
            component="img"
            src={logo}
            sx={{ height: 35, width: 'auto', objectFit: 'contain' }}
          />
        );
      }
      return logo;
    }
    return null;
  };

  return (
    <DrawerHeaderStyled theme={theme} open={open} sx={headerStyles}>
      {renderLogo()}
    </DrawerHeaderStyled>
  );
};

export default DrawerHeader;
