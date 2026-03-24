import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { DataGuard, PageWrapper } from '@mocho/ui/components';
import { DetailLayout } from 'components/DetailLayout';
import { ContextualAlert } from 'components/ContextualAlert';
import { useSelector, useDispatch } from 'store';
import { fetchLoadDetailsRequest, deleteLoadRequest } from '../../store/reducers';
import {
  selectLoadById,
  selectLoadDetailById,
  selectLoadDetailLoading,
  selectFormattedLoadById,
} from '../../store/selectors/loadSelectors';
import {
  STATUS_LABELS,
  NEXT_STATUS,
  NEXT_STATUS_LABELS,
  ALTERNATIVE_STATUSES,
  LOAD_DETAIL_TABS,
  TRANSITION_PREREQUISITES,
} from '../../constants';
import { StatusChangeDialog } from '../../components/StatusChangeDialog';
import { LoadRouteDrawer } from '../../components/LoadRouteDrawer';
import { LoadCargoDrawer } from '../../components/LoadCargoDrawer';
import { LoadAssignmentDrawer } from '../../components/LoadAssignmentDrawer';
import { LoadSummaryBar } from '../../components/LoadSummaryBar';
import { OverviewTab } from './tabs/OverviewTab';
import { FinancialsTab } from './tabs/FinancialsTab';
import { DocumentsTab } from './tabs/DocumentsTab';
import type { LoadStatus } from '../../types';
import { NotificationPanel } from '../../components/NotificationPanel';
import { formattedCurrentUserSelector } from 'features/auth/store/selectors/authSelector';

const LoadDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const loadSummary = useSelector(selectLoadById(id ?? ''));
  const load = useSelector(selectLoadDetailById(id ?? ''));
  const isLoading = useSelector(selectLoadDetailLoading(id ?? ''));
  const formattedLoadSelector = useMemo(() => selectFormattedLoadById(id ?? ''), [id]);
  const formattedLoad = useSelector(formattedLoadSelector);
  const currentUser = useSelector(formattedCurrentUserSelector);
  const isAdmin = currentUser.role === 'ADMIN';

  // UI state
  const [activeTab, setActiveTab] = useState('overview');
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusDialogTarget, setStatusDialogTarget] = useState<LoadStatus | null>(null);
  const [alternativesAnchor, setAlternativesAnchor] = useState<null | HTMLElement>(null);
  const [activeDrawer, setActiveDrawer] = useState<'route' | 'cargo' | 'assignment' | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [showRateConPrompt, setShowRateConPrompt] = useState(
    () => searchParams.get('showRateConPrompt') === 'true',
  );

  useEffect(() => {
    if (id) {
      dispatch(fetchLoadDetailsRequest({ id }));
    }
  }, [dispatch, id]);

  const nextStatus = loadSummary ? NEXT_STATUS[loadSummary.status] : undefined;
  const altStatuses = loadSummary ? (ALTERNATIVE_STATUSES[loadSummary.status] ?? []) : [];

  // Handlers
  const handlePrimaryAction = useCallback(() => {
    if (nextStatus) {
      setStatusDialogTarget(nextStatus);
      setStatusDialogOpen(true);
    }
  }, [nextStatus]);

  const handleAlternativeClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAlternativesAnchor(event.currentTarget);
  }, []);

  const handleAlternativeSelect = useCallback((status: LoadStatus) => {
    setAlternativesAnchor(null);
    setStatusDialogTarget(status);
    setStatusDialogOpen(true);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setAlternativesAnchor(null);
  }, []);

  const handleCloseStatusDialog = useCallback(() => {
    setStatusDialogOpen(false);
    setStatusDialogTarget(null);
  }, []);

  const handleBack = useCallback(() => {
    navigate('/loads');
  }, [navigate]);

  const handleCloseDrawer = useCallback(() => {
    setActiveDrawer(null);
  }, []);

  const handleDismissRateConPrompt = useCallback(() => {
    setShowRateConPrompt(false);
  }, []);

  const handleCreateInvoice = useCallback(() => {
    if (id) {
      navigate(`/invoices/builder/${id}`);
    }
  }, [navigate, id]);

  const handleDeleteClick = useCallback(() => {
    setDeleteConfirmOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (id) {
      dispatch(deleteLoadRequest({ id }));
    }
    setDeleteConfirmOpen(false);
  }, [dispatch, id]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirmOpen(false);
  }, []);

  return (
    <PageWrapper isLoading={isLoading} errorContext="LoadDetailPage">
      <DataGuard
        data={load}
        emptyComponent={<Typography p={4}>Load details not found.</Typography>}
      >
        {(load) => (
          <>
            <DetailLayout
              id={load.loadNumber}
              status={load.status}
              breadcrumb={{ label: 'Loads', href: '/loads' }}
              onBack={handleBack}
              tabs={LOAD_DETAIL_TABS}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              summary={
                formattedLoad ? <LoadSummaryBar summary={formattedLoad.summary} /> : undefined
              }
              actions={
                <>
                  {isAdmin && (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteOutlineIcon />}
                      onClick={handleDeleteClick}
                    >
                      Delete
                    </Button>
                  )}
                  {load.status === 'DELIVERED' && (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<ReceiptLongIcon />}
                      onClick={handleCreateInvoice}
                    >
                      Create Invoice
                    </Button>
                  )}
                  {nextStatus && (
                    <Button variant="contained" onClick={handlePrimaryAction}>
                      {NEXT_STATUS_LABELS[load.status] ?? STATUS_LABELS[nextStatus]}
                    </Button>
                  )}
                  {altStatuses.length > 0 && (
                    <>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleAlternativeClick}
                        endIcon={<ArrowDropDownIcon />}
                      >
                        More
                      </Button>
                      <Menu
                        anchorEl={alternativesAnchor}
                        open={Boolean(alternativesAnchor)}
                        onClose={handleCloseMenu}
                      >
                        {altStatuses.map((status) => (
                          <MenuItem key={status} onClick={() => handleAlternativeSelect(status)}>
                            {STATUS_LABELS[status]}
                          </MenuItem>
                        ))}
                      </Menu>
                    </>
                  )}
                </>
              }
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
                  onEditRoute={() => setActiveDrawer('route')}
                  onEditAssignment={() => setActiveDrawer('assignment')}
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

              {activeTab === 'notifications' && <NotificationPanel loadId={load.id} />}


            </DetailLayout>

            {statusDialogTarget && (
              <StatusChangeDialog
                open={statusDialogOpen}
                onClose={handleCloseStatusDialog}
                loadId={load.id}
                loadNumber={load.loadNumber}
                currentStatus={load.status}
                targetStatus={statusDialogTarget}
                prerequisites={(TRANSITION_PREREQUISITES[statusDialogTarget] ?? []).map(
                  (prereq) => ({
                    label: prereq.label,
                    met: Boolean(
                      load[prereq.field as keyof typeof load],
                    ),
                  }),
                )}
              />
            )}

            {activeDrawer === 'route' && (
              <LoadRouteDrawer load={load} onClose={handleCloseDrawer} />
            )}

            {activeDrawer === 'cargo' && (
              <LoadCargoDrawer load={load} onClose={handleCloseDrawer} />
            )}

            {activeDrawer === 'assignment' && (
              <LoadAssignmentDrawer load={load} onClose={handleCloseDrawer} />
            )}

            <Dialog open={deleteConfirmOpen} onClose={handleDeleteCancel} maxWidth="xs" fullWidth>
              <DialogTitle>Delete Load</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  Are you sure you want to delete load {load.loadNumber}? This action cannot be
                  undone.
                </DialogContentText>
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleDeleteCancel}>Cancel</Button>
                <Button onClick={handleDeleteConfirm} variant="contained" color="error">
                  Delete
                </Button>
              </DialogActions>
            </Dialog>
          </>
        )}
      </DataGuard>
    </PageWrapper>
  );
};

export default LoadDetailPage;
