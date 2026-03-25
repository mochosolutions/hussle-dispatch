import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { useDispatch, useSelector } from 'store';
import { DataGuard, PageWrapper } from '@mocho/ui/components';
import { DetailLayout } from 'components/DetailLayout';
import { KpiCell } from 'components/Typography';
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
} from './tabs';

const formatCurrency = (value: string): string =>
  `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

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
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchCustomerDetailsRequest({ id }));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (!id) {
      return;
    }
    setStatsLoading(true);
    getCustomerStats(id)
      .then(setCustomerStats)
      .catch(() => setCustomerStats(null))
      .finally(() => setStatsLoading(false));
  }, [id]);

  const handleBack = () => {
    navigate('/customers');
  };

  return (
    <PageWrapper isLoading={isLoading} isError={isError} errorContext="CustomerDetailPage">
      <DataGuard data={customer} emptyComponent={<Typography p={4}>Customer not found.</Typography>}>
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
              <>
                <KpiCell
                  label="MC / DOT"
                  value={c.mcNumber ?? '\u2014'}
                  sub={c.dotNumber ?? '\u2014'}
                />
                <KpiCell
                  label="PRIMARY CONTACT"
                  value={c.phone ?? '\u2014'}
                  sub={c.email ?? '\u2014'}
                />
                <KpiCell
                  label="PAYMENT TERMS"
                  value={c.paymentTerms}
                  sub={c.quickPayDiscount ? `Quick Pay ${c.quickPayDiscount}%` : '\u2014'}
                />
                <KpiCell
                  label="AVG DAYS TO PAY"
                  value={
                    statsLoading
                      ? '\u2026'
                      : customerStats?.avgDaysToPay !== null &&
                          customerStats?.avgDaysToPay !== undefined
                        ? `${customerStats.avgDaysToPay} days`
                        : '\u2014'
                  }
                />
                <KpiCell
                  label="OUTSTANDING AR"
                  value={
                    statsLoading
                      ? '\u2026'
                      : customerStats
                        ? formatCurrency(customerStats.outstandingAR)
                        : '\u2014'
                  }
                  valueProps={
                    customerStats && Number(customerStats.outstandingAR) > 0
                      ? { color: 'warning.main' }
                      : undefined
                  }
                />
                <KpiCell
                  label="TOTAL REVENUE"
                  value={
                    statsLoading
                      ? '\u2026'
                      : customerStats
                        ? formatCurrency(customerStats.totalRevenue)
                        : '\u2014'
                  }
                  sub={
                    statsLoading
                      ? ''
                      : `${customerStats?.loadCount ?? c.loadCount} loads`
                  }
                  valueProps={
                    customerStats && Number(customerStats.totalRevenue) > 0
                      ? { color: 'success.main' }
                      : undefined
                  }
                />
              </>
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
              <Typography color="text.secondary">Invoices coming soon.</Typography>
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
