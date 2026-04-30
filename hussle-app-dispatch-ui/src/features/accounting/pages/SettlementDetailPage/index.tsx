import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@mui/material';
import { DataGuard, PageWrapper } from '@mocho/ui/components';
import { DetailLayout } from 'components/DetailLayout';
import { BodyStrong, BodyMuted } from 'components/Typography';
import { useDispatch, useSelector } from 'store';
import { useDrawerActions } from 'features/ui/hooks/useDrawerActions';
import {
  fetchSettlementDetailRequest,
  approveSettlementRequest,
  downloadSettlementPdfRequest,
} from '../../store/reducers/settlementPageSlice';
import {
  selectSettlementDetailById,
  selectSettlementDetailLoading,
} from '../../store/selectors/settlementSelectors';
import { OverviewTab } from '../../components/SettlementDetailPage/OverviewTab';
import { LineItemsTab } from '../../components/SettlementDetailPage/LineItemsTab';

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
  const { openDrawer } = useDrawerActions();

  const [activeTab, setActiveTab] = useState<string>('overview');

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

  const handleDownloadPdf = useCallback(
    (shortId: string) => {
      if (id) {
        dispatch(downloadSettlementPdfRequest({ id, shortId }));
      }
    },
    [dispatch, id],
  );

  const handleOpenPayModal = useCallback(() => {
    if (id) {
      openDrawer('paySettlement', { settlementId: id });
    }
  }, [id, openDrawer]);

  const handleOpenDisputeDrawer = useCallback(() => {
    if (id) {
      openDrawer('disputeSettlement', { settlementId: id });
    }
  }, [id, openDrawer]);

  const renderActions = () => {
    if (!settlement) {
      return null;
    }

    return (
      <>
        <Button
          variant="outlined"
          size="small"
          onClick={() => handleDownloadPdf(settlement.settlementNumber)}
        >
          Download PDF
        </Button>
        {settlement.status === 'DRAFT' && (
          <Button variant="contained" size="small" onClick={handleApprove}>
            Approve
          </Button>
        )}
        {settlement.status === 'APPROVED' && (
          <Button variant="contained" size="small" onClick={handleOpenPayModal}>
            Mark Paid
          </Button>
        )}
        {settlement.status !== 'PAID' && (
          <Button
            variant="outlined"
            size="small"
            color="warning"
            onClick={handleOpenDisputeDrawer}
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
        <BodyMuted sx={{ display: 'block' }}>CARRIER</BodyMuted>
        <BodyStrong>{settlement.carrierName}</BodyStrong>
        <BodyMuted sx={{ display: 'block', mt: 0.5 }}>DRIVER</BodyMuted>
        <BodyStrong>{settlement.driverName ?? '\u2014'}</BodyStrong>
        <BodyMuted sx={{ display: 'block', mt: 0.5 }}>PERIOD</BodyMuted>
        <BodyStrong>
          {formatDate(settlement.periodStart)} \u2013 {formatDate(settlement.periodEnd)}
        </BodyStrong>
        <BodyMuted sx={{ display: 'block', mt: 0.5 }}>TOTAL MILES</BodyMuted>
        <BodyStrong>{settlement.totalMiles.toLocaleString()}</BodyStrong>
      </>
    );
  };

  return (
    <PageWrapper isLoading={isLoading} errorContext="SettlementDetailPage">
      <DataGuard
        data={settlement}
        emptyComponent={<BodyMuted sx={{ p: 4 }}>Settlement not found.</BodyMuted>}
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
    </PageWrapper>
  );
};

export default SettlementDetailPage;
