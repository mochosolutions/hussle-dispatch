import type { ReactNode } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

// project import
import DrawerHeaderStyled from './DrawerHeaderStyled';
import Logo from '../../../../Logo';
import useConfig from '../../../../../hooks/useConfig';

// types
import { MenuOrientation } from '../../../../../types/config';

// ==============================|| DRAWER HEADER ||============================== //

interface Props {
	open: boolean;
	logo?: ReactNode;
	logoIcon?: ReactNode;
	styles?: Record<string, unknown>;
}

const DrawerHeader = ({ open, logo, logoIcon, styles }: Props) => {
	const theme = useTheme();
	const downLG = useMediaQuery(theme.breakpoints.down('lg'));

	const { menuOrientation } = useConfig();
	const isHorizontal =
		menuOrientation === MenuOrientation.HORIZONTAL && !downLG;
	const headerStyles = {
		minHeight: isHorizontal ? 'unset' : '60px',
		width: isHorizontal ? { xs: '100%', lg: '424px' } : 'inherit',
		paddingTop: isHorizontal ? { xs: '10px', lg: '0' } : '8px',
		paddingBottom: isHorizontal ? { xs: '18px', lg: '0' } : '8px',
		paddingLeft: isHorizontal ? { xs: '24px', lg: '0' } : open ? '24px' : 0,
		...(styles ?? {}),
	};

	const renderLogo = () => {
		if (!open && logoIcon) return logoIcon;
		if (open && logo) return logo;
		return (
			<Logo isIcon={!open} sx={{ width: open ? 'auto' : 35, height: 35 }} />
		);
	};

	return (
		<DrawerHeaderStyled theme={theme} open={open} sx={headerStyles}>
			{renderLogo()}
		</DrawerHeaderStyled>
	);
};

export default DrawerHeader;
