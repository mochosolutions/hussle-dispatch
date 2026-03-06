import { Typography } from '@mui/material';
import { PageWrapper, PageHeader, MainCard } from '@mocho/ui/components';

const HomePage = () => {
  return (
    <PageWrapper errorContext="HomePage">
      <PageHeader title="Hello Hussle" subtitle="Fleet Command Dispatch" />
      <MainCard>
        <Typography variant="body1">
          Welcome to the Hussle App Dispatch UI. This is your fleet 
        </Typography>
      </MainCard>
    </PageWrapper>
  );
};

export default HomePage;
