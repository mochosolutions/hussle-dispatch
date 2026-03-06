import {Outlet} from 'react-router-dom';
// import {MainLayoutContainer} from '../MainLayoutContainer';
import {Box, Container} from '@mui/material';
import Header from './Header';
import Footer from './Footer';

import styled from 'styled-components';

export const MainLayoutContainer = styled.div`
  height: 100%;
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    'sidebar header header'
    'sidebar main main'
    'sidebar footer footer';
  overflow: auto;

  .header {
    grid-area: header;
  }

  .sidebar {
    grid-area: sidebar;
    border: 1px solid black;
  }

  .main {
    grid-area: main;
    display: flex;
  }

  .footer {
    grid-area: footer;
    min-height: 40px;
    padding: 1rem 0;
  }
`;




const ProfileSetupLayout = () => (
  <MainLayoutContainer>
    <Header />

    <Box
      component="main"
      className="main"
      sx={{
        width: '100%',
        overflow: 'hidden',
        flexGrow: 1,
        p: {xs: 2, sm: 3},
      }}
    >
      <Container
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          // justifyContent: "flex-end",
        }}
      >
        <Outlet />
      </Container>
    </Box>

    <Footer />
  </MainLayoutContainer>
);

export default ProfileSetupLayout;
