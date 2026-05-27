import {Theme} from '@mui/material/styles';
import {Box, Grid} from '@mui/material';
import Logo from 'mocho/components/Logo';
import MainCard from 'mocho/components/MainCard';
import type {MainCardProps} from 'mocho/components/MainCard';

const AuthCard = ({children, ...other}: MainCardProps) => (
  <MainCard
    sx={{
      maxWidth: {xs: 400, lg: 475},
      margin: {xs: 2.5, md: 3},
      '& > *': {
        flexGrow: 1,
        flexBasis: '50%',
      },
      // border: "1px solid #e1e1e1",
    }}
    content={false}
    {...other}
    border={false}
    boxShadow
    shadow={(theme: Theme) => theme.customShadows.z1}
  >
    <Grid item xs={12} sx={{ml: 3, mt: 3}}>
      <Logo text="Hussle Dispatch" />
    </Grid>
    <Box sx={{p: {xs: 2, sm: 3, md: 4, xl: 5}}} style={{paddingTop: '0px'}}>
      {children}
    </Box>
  </MainCard>
);

export default AuthCard;
