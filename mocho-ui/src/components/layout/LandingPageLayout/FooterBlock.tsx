// material-ui
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import CardMedia from '@mui/material/CardMedia';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third party
import { motion } from 'framer-motion';

// project import
import AnimateButton from '../../extended/AnimateButton';

import useConfig from '../../../hooks/useConfig';
import { ThemeDirection, ThemeMode } from '../../../config';
import { getImageUrl, ImagePath } from '../../../utils/getImageUrl';

// assets
import SendOutlined from '@ant-design/icons/SendOutlined';
import FacebookFilled from '@ant-design/icons/FacebookFilled';
import InstagramFilled from '@ant-design/icons/InstagramFilled';
import LinkedinFilled from '@ant-design/icons/LinkedinFilled';
import TwitterOutlined from '@ant-design/icons/TwitterOutlined';

// Logo placeholder - applications should provide their own logo
const imgfooterlogo = '';

// link - custom style
const FooterLink = styled(Link)(({ theme }) => ({
	color: theme.palette.text.secondary,
	'&:hover': {
		color: theme.palette.primary.main,
	},
	'&:active': {
		color: theme.palette.primary.main,
	},
}));

// ==============================|| LANDING - FOOTER PAGE ||============================== //

type showProps = {
	isFull?: boolean;
};

export default function FooterBlock({ isFull }: showProps) {
	const theme = useTheme();
	const { mode, presetColor } = useConfig();
	const textColor =
		mode === ThemeMode.DARK ? 'text.primary' : 'background.paper';

	const linkSX = {
		color: 'common.white',
		fontSize: '1.1rem',
		fontWeight: 400,
		opacity: '0.6',
		cursor: 'pointer',
		'&:hover': {
			opacity: '1',
		},
	};

	const frameworks = [
		{
			title: 'CodeIgniter',
			link: 'https://codedthemes.com/item/mantis-codeigniter-admin-template/',
		},
		{
			title: 'React MUI',
			link: 'https://mui.com/store/items/mantis-react-admin-dashboard-template/',
		},
		{
			title: 'Angular',
			link: 'https://codedthemes.com/item/mantis-angular-admin-template/',
		},
		{
			title: 'Bootstrap 5',
			link: 'https://codedthemes.com/item/mantis-bootstrap-admin-dashboard/',
		},
		{
			title: '.Net',
			link: 'https://codedthemes.com/item/mantis-dotnet-bootstrap-dashboard-template/',
		},
	];

	return (
		<>
			<Box sx={{ pt: isFull ? 0 : 10, pb: 10, bgcolor: 'grey.A700' }}>
				<Container>
					<Grid container spacing={2}>
						<Grid item xs={12} md={4}>
							<motion.div
								initial={{ opacity: 0, translateY: 550 }}
								animate={{ opacity: 1, translateY: 0 }}
								transition={{
									type: 'spring',
									stiffness: 150,
									damping: 30,
								}}
							>
								<Grid container spacing={2}>
									<Grid item xs={12}>
										<CardMedia
											component='img'
											image={imgfooterlogo}
											sx={{ width: 'auto' }}
										/>
									</Grid>
									<Grid item xs={12}>
										<Typography
											variant='subtitle1'
											sx={{ fontWeight: 400, color: 'common.white' }}
										>
											Since 2017, More than 50K+ Developers trust the
											CodedThemes Digital Product. Mantis React is Manage under
											their Experienced Team Players.
										</Typography>
									</Grid>
								</Grid>
							</motion.div>
						</Grid>
						<Grid item xs={12} md={8}>
							<Grid container spacing={{ xs: 5, md: 2 }}>
								<Grid item xs={6} sm={3}>
									<Stack spacing={{ xs: 3, md: 5 }}>
										<Typography
											variant='h5'
											color={textColor}
											sx={{ fontWeight: 500 }}
										>
											Help
										</Typography>
										<Stack spacing={{ xs: 1.5, md: 2.5 }}>
											<FooterLink
												href='https://blog.mantisdashboard.io/'
												target='_blank'
												underline='none'
											>
												Blog
											</FooterLink>
											<FooterLink
												href='https://codedthemes.gitbook.io/mantis/'
												target='_blank'
												underline='none'
											>
												Documentation
											</FooterLink>
											<FooterLink
												href='https://codedthemes.gitbook.io/mantis/changelog'
												target='_blank'
												underline='none'
											>
												Change Log
											</FooterLink>
											<FooterLink
												href='https://codedthemes.support-hub.io/'
												target='_blank'
												underline='none'
											>
												Support
											</FooterLink>
										</Stack>
									</Stack>
								</Grid>
								<Grid item xs={6} sm={3}>
									<Stack spacing={{ xs: 3, md: 5 }}>
										<Typography
											variant='h5'
											color={textColor}
											sx={{ fontWeight: 500 }}
										>
											Store Help
										</Typography>
										<Stack spacing={{ xs: 1.5, md: 2.5 }}>
											<FooterLink
												href='https://mui.com/store/license/'
												target='_blank'
												underline='none'
											>
												License
											</FooterLink>
											<FooterLink
												href='https://mui.com/store/customer-refund-policy/'
												target='_blank'
												underline='none'
											>
												Refund Policy
											</FooterLink>
											<FooterLink
												href='https://support.mui.com/hc/en-us/sections/360002564979-For-customers'
												target='_blank'
												underline='none'
											>
												Submit a Request
											</FooterLink>
										</Stack>
									</Stack>
								</Grid>
								<Grid item xs={6} sm={3}>
									<Stack spacing={{ xs: 3, md: 5 }}>
										<Typography
											variant='h5'
											color={textColor}
											sx={{ fontWeight: 500 }}
										>
											Mantis Eco-System
										</Typography>
										<Stack spacing={{ xs: 1.5, md: 2.5 }}>
											{frameworks.map((item, index) => (
												<FooterLink
													href={item.link}
													target='_blank'
													underline='none'
													key={index}
												>
													{item.title}
													{/* {item.isUpcoming && <Chip variant="outlined" size="small" label="Upcoming" sx={{ ml: 0.5 }} />} */}
												</FooterLink>
											))}
										</Stack>
									</Stack>
								</Grid>
								<Grid item xs={6} sm={3}>
									<Stack spacing={{ xs: 3, md: 5 }}>
										<Typography
											variant='h5'
											color={textColor}
											sx={{ fontWeight: 500 }}
										>
											More Products
										</Typography>
										<Stack spacing={{ xs: 1.5, md: 2.5 }}>
											<FooterLink
												href='http://mui.com/store/previews/berry-react-material-admin/'
												target='_blank'
												underline='none'
											>
												Berry React Material
											</FooterLink>
											<FooterLink
												href='https://mui.com/store/previews/berry-react-material-admin-free/'
												target='_blank'
												underline='none'
											>
												Free Berry React
											</FooterLink>
											<FooterLink
												href='https://github.com/codedthemes/mantis-free-react-admin-template'
												target='_blank'
												underline='none'
											>
												Free Mantis React
											</FooterLink>
										</Stack>
									</Stack>
								</Grid>
							</Grid>
						</Grid>
					</Grid>
				</Container>
			</Box>
			<Divider sx={{ borderColor: 'grey.700' }} />
			<Box sx={{ py: 1.5, bgcolor: 'grey.800' }}>
				<Container>
					<Grid container spacing={2}>
						<Grid item xs={12} sm={8}>
							<Typography variant='subtitle2' color='secondary'>
								© Made with love by Team CodedThemes
							</Typography>
						</Grid>
						<Grid item xs={12} sm={4}>
							<Grid
								container
								spacing={2}
								alignItems='center'
								sx={{ justifyContent: 'flex-end' }}
							>
								<Grid item>
									<Link
										href='https://www.instagram.com/codedthemes'
										underline='none'
										target='_blank'
										sx={linkSX}
									>
										<InstagramFilled />
									</Link>
								</Grid>
								<Grid item>
									<Link
										href='https://twitter.com/codedthemes/status/1768163845858603500'
										underline='none'
										target='_blank'
										sx={linkSX}
									>
										<TwitterOutlined />
									</Link>
								</Grid>
								<Grid item>
									<Link
										href='https://in.linkedin.com/company/codedthemes'
										underline='none'
										target='_blank'
										sx={linkSX}
									>
										<LinkedinFilled />
									</Link>
								</Grid>
								<Grid item>
									<Link
										href='https://www.facebook.com/codedthemes/'
										underline='none'
										target='_blank'
										sx={linkSX}
									>
										<FacebookFilled />
									</Link>
								</Grid>
							</Grid>
						</Grid>
					</Grid>
				</Container>
			</Box>
		</>
	);
}
