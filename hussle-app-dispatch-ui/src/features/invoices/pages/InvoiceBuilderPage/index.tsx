import { useParams } from 'react-router-dom';
import MainCard from 'components/MainCard';
import { PageWrapper } from 'components/PageWrapper';
import { PageHeader } from 'components/PageHeader';
import { BodyMuted } from 'components/Typography';

const InvoiceBuilderPage = () => {
  const { loadId } = useParams<{ loadId: string }>();

  return (
    <PageWrapper errorContext="InvoiceBuilderPage">
      <PageHeader title="Invoice Builder" />
      <MainCard>
        <BodyMuted sx={{ py: 4, textAlign: 'center' }}>
          Invoice Builder — Coming Soon (Load: {loadId})
        </BodyMuted>
      </MainCard>
    </PageWrapper>
  );
};

export default InvoiceBuilderPage;
