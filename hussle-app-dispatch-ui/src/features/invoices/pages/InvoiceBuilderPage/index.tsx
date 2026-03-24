import { Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import MainCard from 'components/MainCard';
import { PageWrapper } from 'components/PageWrapper';
import { PageHeader } from 'components/PageHeader';

const InvoiceBuilderPage = () => {
  const { loadId } = useParams<{ loadId: string }>();

  return (
    <PageWrapper errorContext="InvoiceBuilderPage">
      <PageHeader title="Invoice Builder" />
      <MainCard>
        <Typography variant="body1" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          Invoice Builder — Coming Soon (Load: {loadId})
        </Typography>
      </MainCard>
    </PageWrapper>
  );
};

export default InvoiceBuilderPage;
