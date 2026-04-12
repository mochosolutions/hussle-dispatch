import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Typography } from '@mui/material';
import { DataGuard, PageWrapper } from '@mocho/ui/components';
import { DetailLayout } from 'components/DetailLayout';
import { useDispatch, useSelector } from 'store';
import {
  fetchSettlementDetailRequest,
  approveSettlementRequest,
} from '../../store/reducers/settlementPageSlice';
import {
  selectSettlementDetailById,
  selectSettlementDetailLoading,
} from '../../store/selectors/settlementSelectors';
import { OverviewTab } from './tabs/OverviewTab';
import { LineItemsTab } from './tabs/LineItemsTab';
import { PaySettlementDrawer } from '../../components/PaySettlementDrawer';
import { DisputeSettlementDrawer } from '../../components/DisputeSettlementDrawer';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TABS = [
  { label: 'Overview', value: 'overview' },
  { label: 'Line Items', value: 'line-items' },
] as const;

const toSettlementStatusKey = (status: string): string => `SETTLEMENT_${status}`;

const formatDate = (value: string | null): string => {
  if (!value) {
    return '\u2014';
  }
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SettlementDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [payDrawerOpen, setPayDrawerOpen] = useState(false);
  const [disputeDrawerOpen, setDisputeDrawerOpen] = useState(false);

  const detailSelector = useMemo(() => selectSettlementDetailById(id ?? ''), [id]);
  const settlement = useSelector(detailSelector);

  const loadingSelector = useMemo(() => selectSettlementDetailLoading(id ?? ''), [id]);
  const isLoading = useSelector(loadingSelector);

  useEffect(() => {
    if (id) {
      dispatch(fetchSettlementDetailRequest({ id }));
    }
  }, [dispatch, id]);

  const handleBack = useCallback(() => {
    navigate('/accounting/settlements');
  }, [navigate]);

  const handleApprove = useCallback(() => {
    if (id) {
      dispatch(approveSettlementRequest({ id }));
    }
  }, [dispatch, id]);

  const renderActions = () => {
    if (!settlement) {
      return null;
    }

    return (
      <>
        {settlement.status === 'DRAFT' && (
          <Button variant="contained" size="small" onClick={handleApprove}>
            Approve
          </Button>
        )}
        {settlement.status === 'APPROVED' && (
          <Button
            variant="contained"
            size="small"
            onClick={() => setPayDrawerOpen(true)}
          >
            Mark Paid
          </Button>
        )}
        {settlement.status !== 'PAID' && (
          <Button
            variant="outlined"
            size="small"
            color="warning"
            onClick={() => setDisputeDrawerOpen(true)}
          >
            Dispute
          </Button>
        )}
      </>
    );
  };

  const renderSummary = () => {
    if (!settlement) {
      return null;
    }

    return (
      <>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          CARRIER
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {settlement.carrierName}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          DRIVER
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {settlement.driverName ?? '\u2014'}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          PERIOD
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {formatDate(settlement.periodStart)} \u2013 {formatDate(settlement.periodEnd)}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          TOTAL MILES
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {settlement.totalMiles.toLocaleString()}
        </Typography>
      </>
    );
  };

  return (
    <PageWrapper isLoading={isLoading} errorContext="SettlementDetailPage">
      <DataGuard
        data={settlement}
        emptyComponent={<Typography p={4}>Settlement not found.</Typography>}
      >
        {(s) => (
          <DetailLayout
            id={s.settlementNumber}
            status={toSettlementStatusKey(s.status)}
            breadcrumb={{ label: 'Settlements', href: '/accounting/settlements' }}
            onBack={handleBack}
            actions={renderActions()}
            summary={renderSummary()}
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          >
            {activeTab === 'overview' && <OverviewTab settlement={s} />}
            {activeTab === 'line-items' && <LineItemsTab settlement={s} />}
          </DetailLayout>
        )}
      </DataGuard>

      {payDrawerOpen && id && (
        <PaySettlementDrawer
          settlementId={id}
          onClose={() => setPayDrawerOpen(false)}
        />
      )}

      {disputeDrawerOpen && id && (
        <DisputeSettlementDrawer
          settlementId={id}
          onClose={() => setDisputeDrawerOpen(false)}
        />
      )}
    </PageWrapper>
  );
};

export default SettlementDetailPage;
