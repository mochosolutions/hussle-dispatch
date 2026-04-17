import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { useDispatch, useSelector } from 'store';
import { DataGuard, PageWrapper } from '@mocho/ui/components';
import { DetailLayout } from 'components/DetailLayout';
import { BodyMuted } from 'components/Typography';
import { getCustomerStats } from 'utils/api/fleet/customerApi';
import type { CustomerStats } from 'utils/api/fleet/customerApi';
import { CUSTOMER_DETAIL_TAB_ITEMS } from '../../constants';
import { selectFormattedCustomerById } from '../../store/selectors/customerSelectors';
import {
  fetchCustomerDetailsRequest,
  customerPageSelectors,
} from '../../store/reducers/customerPageSlice';
import { useDrawerActions } from '../../../ui/hooks/useDrawerActions';
import {
  OverviewTab,
  ContactsTab,
  LoadHistoryTab,
  NotesTab,
  NotificationsTab,
} from '../../components/CustomerDetailPage';
import { CustomerSummaryBar } from '../../components/CustomerDetailPage/CustomerSummaryBar';

const CustomerDetailPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { openDrawer } = useDrawerActions();
  const { id } = useParams();
  const customerSelector = useMemo(() => selectFormattedCustomerById(id), [id]);
  const customer = useSelector(customerSelector);
  const isLoading = useSelector(customerPageSelectors.selectIsEntityLoading('getById', id ?? ''));
  const isError = useSelector(
    (state) => !!customerPageSelectors.selectEntityError('getById', id ?? '')(state),
  );

  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      dispatch(fetchCustomerDetailsRequest({ id }));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (!id) {
      return;
    }

    let cancelled = false;

    getCustomerStats(id)
      .then((data) => {
        if (!cancelled) {
          setCustomerStats(data);
          setStatsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCustomerStats(null);
          setStatsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleBack = () => {
    navigate('/customers');
  };

  return (
    <PageWrapper isLoading={isLoading} isError={isError} errorContext="CustomerDetailPage">
      <DataGuard data={customer} emptyComponent={<BodyMuted sx={{ p: 4 }}>Customer not found.</BodyMuted>}>
        {(c) => (
          <DetailLayout
            id={c.companyName}
            status={`CUSTOMER_${c.status}`}
            breadcrumb={{ label: 'Customers', href: '/customers' }}
            onBack={handleBack}
            actions={
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                size="small"
                sx={{ color: 'common.white', borderColor: 'grey.500' }}
                onClick={() => openDrawer('customerCompanyInfo', { customerId: c.id })}
              >
                Edit
              </Button>
            }
            summary={
              <CustomerSummaryBar
                customer={c}
                stats={customerStats}
                statsLoading={statsLoading}
              />
            }
            tabs={CUSTOMER_DETAIL_TAB_ITEMS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          >
            {activeTab === 'overview' && id && (
              <OverviewTab
                customer={c}
                onEditCompanyInfo={() => openDrawer('customerCompanyInfo', { customerId: id })}
              />
            )}

            {activeTab === 'contacts' && id && <ContactsTab customerId={id} />}

            {activeTab === 'loadHistory' && id && <LoadHistoryTab customerId={id} />}

            {activeTab === 'invoices' && id && (
              <BodyMuted>Invoices coming soon.</BodyMuted>
            )}

            {activeTab === 'notifications' && id && <NotificationsTab customerId={id} />}

            {activeTab === 'notes' && id && <NotesTab customerId={id} notes={c.notes} />}
          </DetailLayout>
        )}
      </DataGuard>
    </PageWrapper>
  );
};

export default CustomerDetailPage;
