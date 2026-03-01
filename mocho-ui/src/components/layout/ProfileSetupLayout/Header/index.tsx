import {Box, Typography, Container} from '@mui/material';
import Logo from '../../../Logo';

const Header = () => (
  <div
    className="header"
    style={{
      gridArea: 'header',
      height: '80px',
    }}
  >
    <Container>
      <Box
        sx={{
          width: '100%',
          // height: '80px',
          alignItems: 'center',
          justifyContent: 'space-between',
          // display: { xs: 'flex', md: 'none' },
          // borderBottom: "1px solid rgba(34,38,63,.149)",
        }}
      >
        <Typography sx={{textAlign: 'left', display: 'inline-block'}}>
          <Logo reverse to="/" />
        </Typography>
      </Box>
    </Container>
  </div>
);

export default Header;
