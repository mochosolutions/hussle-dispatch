import { useMemo } from 'react';
import type { ReactNode } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Box, Drawer, useMediaQuery } from '@mui/material';

// project import
import DrawerHeader from './DrawerHeader';
import DrawerContent from './DrawerContent';
import MiniDrawerStyled from './MiniDrawerStyled';

import { DRAWER_WIDTH } from '../../../../config';
import useLayoutState from '../../../../hooks/useLayoutState';

// types
import type { NavItemType } from '../../../../types/menu';

// ==============================|| MAIN LAYOUT - DRAWER ||============================== //

export interface LayoutDrawerProps {
	menuItems?: NavItemType[];
	logo?: ReactNode;
	logoIcon?: ReactNode;
	header?: ReactNode;
	footer?: ReactNode;
	window?: () => Window;
	navStyles?: Record<string, unknown>;
	paperStyles?: Record<string, unknown>;
	mobilePaperStyles?: Record<string, unknown>;
	headerStyles?: Record<string, unknown>;
}

const MainDrawer = ({
	menuItems,
	logo,
	logoIcon,
	header,
	footer,
	window: windowProp,
	navStyles,
	paperStyles,
	mobilePaperStyles,
	headerStyles,
}: LayoutDrawerProps) => {
	const theme = useTheme();
	const matchDownMD = useMediaQuery(theme.breakpoints.down('lg'));

	const { drawerOpen, onDrawerClose } = useLayoutState();

	// responsive drawer container
	const container =
		windowProp !== undefined ? () => windowProp().document.body : undefined;

	// header content
	const drawerContent = useMemo(
		() => <DrawerContent menuItems={menuItems} />,
		[menuItems],
	);
	const drawerHeader = useMemo(
		() =>
			header ?? (
				<DrawerHeader
					open={drawerOpen}
					logo={logo}
					logoIcon={logoIcon}
					styles={headerStyles}
				/>
			),
		[drawerOpen, header, logo, logoIcon, headerStyles],
	);

	// Desktop: Wrap in Box with nav role
	if (!matchDownMD) {
		return (
			<Box
				component='nav'
				sx={{
					flexShrink: { md: 0 },
					zIndex: 1200,
					...(navStyles ?? {}),
				}}
				aria-label='mailbox folders'
			>
				<MiniDrawerStyled
					variant='permanent'
					open={drawerOpen}
					PaperProps={paperStyles ? { sx: paperStyles } : undefined}
				>
					{drawerHeader}
					{drawerContent}
					{footer}
				</MiniDrawerStyled>
			</Box>
		);
	}

	// Mobile: Render Drawer directly without Box wrapper to avoid stacking context issues
	return (
		<Drawer
			container={container}
			variant='temporary'
			open={drawerOpen}
			onClose={onDrawerClose}
			ModalProps={{
				keepMounted: true,
				slotProps: {
					backdrop: {
						sx: {
							backgroundColor: 'rgba(0, 0, 0, 0.5)',
						},
					},
				},
			}}
			sx={{
				display: { xs: 'block', lg: 'none' },
			}}
			PaperProps={{
				sx: {
					boxSizing: 'border-box',
					width: DRAWER_WIDTH,
					borderRight: `1px solid ${theme.palette.divider}`,
					backgroundImage: 'none',
					boxShadow: 'inherit',
					...(paperStyles ?? {}),
					...(mobilePaperStyles ?? {}),
				},
			}}
		>
			{drawerHeader}
			{drawerContent}
			{footer}
		</Drawer>
	);
};

export default MainDrawer;
