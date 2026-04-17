import { useEffect, useState, useCallback, useMemo } from 'react';
import { Typography } from '@mui/material';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { DataGuard, PageWrapper } from '@mocho/ui/components';
import { DetailLayout } from 'components/DetailLayout';
import { ContextualAlert } from 'components/ContextualAlert';
import { useSelector, useDispatch } from 'store';
import { fetchLoadDetailsRequest } from '../../store/reducers';
import {
  selectLoadDetailById,
  selectLoadDetailLoading,
  selectFormattedLoadById,
} from '../../store/selectors/loadSelectors';
import { LOAD_DETAIL_TABS } from '../../constants';
import { LoadSummaryBar } from '../../components/LoadDetailPage/LoadSummaryBar';
import { OverviewTab } from '../../components/LoadDetailPage/OverviewTab';
import { FinancialsTab } from '../../components/LoadDetailPage/FinancialsTab';
import { DocumentsTab } from '../../components/LoadDetailPage/DocumentsTab';
import NotificationTab from '../../components/LoadDetailPage/NotificationTab';
import { LoadDetailActions } from '../../components/LoadDetailPage/LoadDetailActions';
import { openDrawer } from '../../../ui/store/reducers/uiSlice';

const LoadDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const load = useSelector(selectLoadDetailById(id ?? ''));
  const isLoading = useSelector(selectLoadDetailLoading(id ?? ''));
  const formattedLoadSelector = useMemo(() => selectFormattedLoadById(id ?? ''), [id]);
  const formattedLoad = useSelector(formattedLoadSelector);

  const [activeTab, setActiveTab] = useState('overview');
  const [showRateConPrompt, setShowRateConPrompt] = useState(
    () => searchParams.get('showRateConPrompt') === 'true',
  );

  useEffect(() => {
    if (id) {
      dispatch(fetchLoadDetailsRequest({ id }));
    }
  }, [dispatch, id]);

  const handleBack = useCallback(() => {
    navigate('/loads');
  }, [navigate]);

  const handleDismissRateConPrompt = useCallback(() => {
    setShowRateConPrompt(false);
  }, []);

  const handleCreateInvoice = useCallback(() => {
    if (id) {
      navigate(`/invoices/builder/${id}`);
    }
  }, [navigate, id]);

  const handleEditRoute = (drawerType: string) => {
    dispatch(openDrawer({ drawerType, drawerProps: { load: load } }));
  };

  return (
    <PageWrapper isLoading={isLoading} errorContext="LoadDetailPage">
      <DataGuard
        data={load}
        emptyComponent={<Typography p={4}>Load details not found.</Typography>}
      >
        {(load) => (
          <DetailLayout
            id={load.loadNumber}
            status={load.status}
            breadcrumb={{ label: 'Loads', href: '/loads' }}
            onBack={handleBack}
            tabs={LOAD_DETAIL_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            summary={formattedLoad ? <LoadSummaryBar summary={formattedLoad.summary} /> : undefined}
            actions={<LoadDetailActions load={load} onCreateInvoice={handleCreateInvoice} />}
          >
            {load.status === 'DELIVERED' && (
              <ContextualAlert
                severity="success"
                title="Load delivered — ready to invoice"
                description="POD has been uploaded. All required documents are present."
                action={{ label: 'Create Invoice', onClick: handleCreateInvoice }}
              />
            )}

            {activeTab === 'overview' && (
              <OverviewTab
                load={load}
                onEditRoute={() => handleEditRoute('loadRoute')}
                onEditAssignment={() => handleEditRoute('loadAssignment')}
                onEditContact={() => handleEditRoute('loadContact')}
                onEditRate={() => handleEditRoute('loadRate')}
                onTabChange={setActiveTab}
              />
            )}

            {activeTab === 'financials' && <FinancialsTab load={load} />}

            {activeTab === 'documents' && (
              <DocumentsTab
                load={load}
                showRateConPrompt={showRateConPrompt}
                onDismissRateConPrompt={handleDismissRateConPrompt}
              />
            )}

            {activeTab === 'notifications' && (
              <NotificationTab loadId={load.id} customerId={load.customer?.id ?? null} />
            )}
          </DetailLayout>
        )}
      </DataGuard>
    </PageWrapper>
  );
};

export default LoadDetailPage;
