import * as React from 'react';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import useMediaQuery from '@mui/material/useMediaQuery';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Drawer from '@mui/material/Drawer';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Logo from '../../Logo';
import IconButton from '../../extended/IconButton';
import { ThemeMode } from '../../../config';
import MenuOutlined from '@ant-design/icons/MenuOutlined';;
import { motion, AnimatePresence } from 'framer-motion';
import { styled } from '@mui/material/styles';

const navItems: any[] = [
	{
		label: 'Job Seekers',
		path: '/job-seekers',
	},
	{
		label: 'Employers',
		path: '/employers',
	},
	{
		label: 'About',
		path: '/about',
		children: {
			header: 'Company Info',
			items: [
				{ label: 'About', path: '/about' },
				{ label: 'Careers', path: '/careers' },
			],
		},
	},
	{
		label: 'Browse Jobs',
		path: '/jobs',
	},
];

// elevation scroll
function ElevationScroll({ children, window }: any) {
	const theme = useTheme();

	const trigger = useScrollTrigger({
		disableHysteresis: true,
		threshold: 10,
		target: window ? window() : undefined,
	});

	const backColorScroll =
		theme.palette.mode === ThemeMode.DARK
			? theme.palette.grey[50]
			: theme.palette.grey[800];

	return React.cloneElement(children, {
		style: {
			background: trigger ? backColorScroll : 'transparent',
		},
	});
}

const StyledRouterLink = styled(RouterLink)(({ theme }) => ({
	display: 'flex',
	alignItems: 'center',
	fontWeight: 'bold',
	textDecoration: 'none',
	color: theme.palette.grey[700],
	'&:hover': {
		backgroundColor: 'transparent',
	},
}));

export default function Header() {
	const theme = useTheme();
	// const { isLoggedIn } = useAuth();
	const isLoggedIn = false; // For demo purposes, set to true

	const downMD = useMediaQuery(theme.breakpoints.down('md'));
	const [drawerToggle, setDrawerToggle] = useState<boolean>(false);
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));
	const [mobileOpen, setMobileOpen] = useState(false);
	const [hoveredItem, setHoveredItem] = useState<any | null>(null);
	// const [elevated, setElevated] = useState(false);
	const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

	const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

	const handleToggle = (label: string) => {
		setOpenItems((prev) => ({
			...prev,
			[label]: !prev[label],
		}));
	};

	const drawerToggler = (open: boolean) => (event: any) => {
		if (
			event.type! === 'keydown' &&
			(event.key! === 'Tab' || event.key! === 'Shift')
		) {
			return;
		}
		setDrawerToggle(open);
	};

	const drawer = (
		<Box sx={{ textAlign: 'center' }}>
			<Typography sx={{ textAlign: 'left', display: 'inline-block' }}>
				<Logo reverse to='/' />
			</Typography>
			<List>
				{navItems.map((item) =>
					item.children ? (
						<React.Fragment key={item.label}>
							<ListItemButton onClick={() => handleToggle(item.label)}>
								<ListItemText primary={item.label} />
								{openItems[item.label] ? (
									<ExpandLessIcon fontSize='small' />
								) : (
									<ExpandMoreIcon fontSize='small' />
								)}
							</ListItemButton>
							<Collapse in={openItems[item.label]} timeout='auto' unmountOnExit>
								<List component='div' disablePadding>
									{item.children.items.map((child) => (
										<ListItem key={child.label} disablePadding>
											<ListItemButton
												// component={NextLink}
												href={child.path}
												onClick={handleDrawerToggle}
												sx={{ pl: 4 }}
											>
												<ListItemText primary={child.label} />
											</ListItemButton>
										</ListItem>
									))}
								</List>
							</Collapse>
						</React.Fragment>
					) : (
						<ListItem key={item.label} disablePadding>
							<ListItemButton
								// component={NextLink}
								href={item.path!}
								onClick={handleDrawerToggle}
							>
								<ListItemText primary={item.label} />
							</ListItemButton>
						</ListItem>
					)
				)}
			</List>
		</Box>
	);

	return (
		// <ElevationScroll>
		<AppBar
			sx={{
				bgcolor: theme.palette.background.paper,
				color: 'text.primary',
				boxShadow: 'none',
				borderBottom: `1px solid ${theme.palette.grey[200]}`,
			}}
			component='nav'
			elevation={0}
			position='sticky'
		>
			<Container disableGutters={downMD}>
				<Toolbar>
					<Stack
						direction='row'
						sx={{ flexGrow: 1, display: { xs: 'none', md: 'block' } }}
						alignItems='center'
					>
						<Typography sx={{ textAlign: 'left', display: 'inline-block' }}>
							<Logo reverse to='/' />
						</Typography>
					</Stack>

					<Stack
						direction='row'
						sx={{
							'& .header-link': { px: 1, '&:hover': { color: 'primary.main' } },
							display: { xs: 'none', md: 'block' },
						}}
						spacing={2}
					>
						{!isMobile && (
							<Box
								sx={{ display: 'flex', gap: 2 }}
								onMouseLeave={() => setHoveredItem(null)}
							>
								{navItems.map((item) => {
									const isActive = hoveredItem?.label === item.label;
									const hasDropdown = item.children && !item.customSubHeader;
									const hasSubHeader = !!item.customSubHeader;
									const isCurrentPath = false;

									return (
										<Box
											key={item.label}
											sx={{
												display: 'flex',
												alignItems: 'center',
												position: 'relative',
											}}
										>
											<StyledRouterLink
												// isCurrentPath={isCurrentPath}
												to={item.path}
												onMouseEnter={() => setHoveredItem(item)}
											>
												{item.label}
												{hasDropdown && <ArrowDropDownIcon />}
											</StyledRouterLink>

											<AnimatePresence>
												{isActive && hasSubHeader && (
													<motion.div
														key='subHeader'
														initial={{ opacity: 0, y: 10 }}
														animate={{ opacity: 1, y: 0 }}
														exit={{ opacity: 0, y: 10 }}
														transition={{ duration: 0.2 }}
														style={{
															position: 'absolute',
															top: '100%',
															left: 0,
															zIndex: theme.zIndex.appBar + 1,
															minWidth: 250,
														}}
													>
														<Box
															sx={{
																bgcolor: 'background.paper',
																border: '1px solid',
																borderColor: 'divider',
																boxShadow: 3,
															}}
														>
															{item.customSubHeader}
														</Box>
													</motion.div>
												)}

												{isActive && hasDropdown && (
													<motion.div
														key='dropdown'
														initial={{ opacity: 0, y: 10 }}
														animate={{ opacity: 1, y: 0 }}
														exit={{ opacity: 0, y: 10 }}
														transition={{ duration: 0.2 }}
														style={{
															position: 'absolute',
															top: '100%',
															left: 0,
															zIndex: theme.zIndex.appBar + 1,
															minWidth: 250,
														}}
													>
														<Paper
															elevation={2}
															sx={{
																bgcolor: 'background.paper',
																border: '1px solid',
																borderColor: 'divider',
																boxShadow: 3,
															}}
														>
															{item.children?.header && (
																<>
																	<Typography
																		variant='subtitle2'
																		sx={{ px: 2, py: 1 }}
																	>
																		{item.children.header}
																	</Typography>
																	<Divider />
																</>
															)}
															<Box
																sx={{
																	display: 'flex',
																	flexDirection: 'column',
																	px: 2,
																}}
															>
																{item?.children?.items.map((child) => (
																	<Button
																		key={child.label}
																		// component={NextLink}
																		href={child.path}
																		onClick={() => setHoveredItem(null)}
																		sx={{
																			justifyContent: 'flex-start',
																			py: 1,
																		}}
																	>
																		{child.label}
																	</Button>
																))}
															</Box>
														</Paper>
													</motion.div>
												)}
											</AnimatePresence>
										</Box>
									);
								})}

								<Button
									variant='contained'
									// component={NextLink}
									href='/login'
									size='large'
									sx={{
										color: theme.palette.primary.contrastText,
										borderColor: theme.palette.primary.main,
										':hover': {
											// backgroundColor: theme.palette.primary.main,
											// color: 'white',
										},
									}}
								>
									Sign Up
								</Button>
							</Box>
						)}
					</Stack>

					<Box
						sx={{
							width: '100%',
							// alignItems: 'center',
							justifyContent: 'space-between',
							display: { xs: 'flex', md: 'none' },
						}}
					>
						<Typography sx={{ textAlign: 'left', display: 'inline-block' }}>
							<Logo reverse to='/' />
						</Typography>

						<Stack direction='row' spacing={2} alignItems='center'>
							<IconButton
								color='inherit'
								onClick={handleDrawerToggle}
								sx={{
									'&:hover': {
										bgcolor: 'secondary.light',
									},
								}}
							>
								<MenuOutlined />
							</IconButton>
						</Stack>

						{isMobile && (
							<Drawer
								anchor='top'
								open={mobileOpen}
								onClose={handleDrawerToggle}
								sx={{ '& .MuiDrawer-paper': { backgroundImage: 'none' } }}
							>
								<Box
									sx={{
										width: 'auto',
										'& .MuiListItemIcon-root': {
											fontSize: '1rem',
											minWidth: 28,
										},
									}}
									role='presentation'
									// onClick={drawerToggler(false)}
									// onKeyDown={drawerToggler(false)}
								>
									{drawer}
								</Box>
							</Drawer>
						)}
					</Box>
				</Toolbar>
			</Container>
		</AppBar>
		// </ElevationScroll>
	);
}
