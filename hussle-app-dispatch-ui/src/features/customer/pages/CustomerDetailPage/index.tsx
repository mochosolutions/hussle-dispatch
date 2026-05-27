import { useState, useEffect, useMemo, lazy } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { useDispatch, useSelector } from 'store';
import { DataGuard, PageWrapper } from '@mocho/ui/components';
import Loadable from 'mocho/components/Loadable';
import { DetailLayout } from 'components/DetailLayout';
import { BodyMuted } from 'components/Typography';
import { CUSTOMER_DETAIL_TAB_ITEMS } from '../../constants';
import {
  selectFormattedCustomerById,
  selectCustomerStats,
  selectCustomerStatsLoading,
} from '../../store/selectors/customerSelectors';
import {
  fetchCustomerDetailsRequest,
  fetchCustomerStatsRequest,
  customerPageSelectors,
} from '../../store/reducers/customerPageSlice';
import { useDrawerActions } from '../../../ui/hooks/useDrawerActions';
import { CustomerSummaryBar } from '../../components/CustomerDetailPage/CustomerSummaryBar';

const OverviewTab = Loadable(
  lazy(() =>
    import('../../components/CustomerDetailPage/OverviewTab').then((m) => ({
      default: m.OverviewTab,
    })),
  ),
);
const ContactsTab = Loadable(
  lazy(() =>
    import('../../components/CustomerDetailPage/ContactsTab').then((m) => ({
      default: m.ContactsTab,
    })),
  ),
);
const LoadHistoryTab = Loadable(
  lazy(() =>
    import('../../components/CustomerDetailPage/LoadHistoryTab').then((m) => ({
      default: m.LoadHistoryTab,
    })),
  ),
);
const NotesTab = Loadable(
  lazy(() =>
    import('../../components/CustomerDetailPage/NotesTab').then((m) => ({ default: m.NotesTab })),
  ),
);
const NotificationsTab = Loadable(
  lazy(() =>
    import('../../components/CustomerDetailPage/NotificationsTab').then((m) => ({
      default: m.NotificationsTab,
    })),
  ),
);

const CustomerDetailPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { openDrawer } = useDrawerActions();
  const { id } = useParams();
  const customerSelector = useMemo(() => selectFormattedCustomerById(id), [id]);
  const customer = useSelector(customerSelector);
  const isError = useSelector(
    (state) => !!customerPageSelectors.selectEntityError('getById', id ?? '')(state),
  );

  const customerStats = useSelector(selectCustomerStats);
  const statsLoading = useSelector(selectCustomerStatsLoading);

  useEffect(() => {
    if (id) {
      dispatch(fetchCustomerDetailsRequest({ id }));
      dispatch(fetchCustomerStatsRequest({ id }));
    }
  }, [dispatch, id]);

  const handleBack = () => {
    navigate('/customers');
  };

  return (
    <PageWrapper isError={isError} errorContext="CustomerDetailPage">
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
