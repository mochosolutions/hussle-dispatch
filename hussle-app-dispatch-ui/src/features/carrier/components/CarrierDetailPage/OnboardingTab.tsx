import { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { CheckCircleOutline, CancelOutlined } from '@mui/icons-material';
import SectionCard from 'components/SectionCard';
import { FieldRow } from 'components/FieldRow';
import { getCarrierOnboardingDetail } from 'utils/api/fleet/carrierApi';
import { ApproveCarrierDialog } from '../../components/ApproveCarrierDialog';
import { RejectCarrierDialog } from '../../components/RejectCarrierDialog';
import type {
  CarrierOnboardingDetail,
  CostAnalysisResult,
  LanePreferenceEntry,
  PortalDocument,
  StatePreferenceEntry,
} from '../../onboardingTypes';

interface OnboardingTabProps {
  carrierId: string;
  carrierName?: string;
  onStatusChanged?: () => void;
}

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const formatRpm = (value: number): string => `$${value.toFixed(2)}/mi`;

const REVIEW_STATUS_COLORS: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  approved: 'success',
  pending_review: 'warning',
  rejected: 'error',
};

const REVIEW_STATUS_LABELS: Record<string, string> = {
  approved: 'Approved',
  pending_review: 'Pending Review',
  rejected: 'Rejected',
};

const STATE_PREF_COLORS: Record<string, 'success' | 'error' | 'default'> = {
  PREFERRED: 'success',
  AVOIDED: 'error',
  NEUTRAL: 'default',
};

// ---------------------------------------------------------------------------
// Sub-sections
// ---------------------------------------------------------------------------

const CompanySection: React.FC<{ carrier: Record<string, unknown> }> = ({ carrier }) => {
  const fuelCards = carrier.fuelCardProviders;
  const fuelCardDisplay = Array.isArray(fuelCards) ? fuelCards.join(', ') : null;

  return (
    <SectionCard title="Phase 1 — Company">
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <FieldRow label="Name" value={String(carrier.name ?? '')} />
          <FieldRow label="MC #" value={String(carrier.mcNumber ?? '')} />
          <FieldRow label="DOT #" value={String(carrier.dotNumber ?? '')} />
          <FieldRow label="EIN" value={String(carrier.ein ?? '')} />
        </Grid>
        <Grid item xs={12} md={6}>
          <FieldRow label="Phone" value={String(carrier.phone ?? '')} />
          <FieldRow label="Email" value={String(carrier.email ?? '')} isLink />
          <FieldRow label="Contact" value={String(carrier.primaryContactName ?? '')} />
          <FieldRow label="Contact Phone" value={String(carrier.primaryContactPhone ?? '')} />
          <FieldRow label="Contact Email" value={String(carrier.primaryContactEmail ?? '')} isLink />
        </Grid>
        <Grid item xs={12} md={6}>
          <FieldRow label="Factoring Co." value={String(carrier.factoringCompanyName ?? '')} />
          <FieldRow label="Factoring Email" value={String(carrier.factoringCompanyEmail ?? '')} />
          <FieldRow label="Submission" value={String(carrier.factoringSubmissionMethod ?? '')} />
        </Grid>
        <Grid item xs={12} md={6}>
          <FieldRow label="Fuel Cards" value={fuelCardDisplay} />
        </Grid>
      </Grid>
    </SectionCard>
  );
};

const EquipmentSection: React.FC<{ vehicles: Record<string, unknown>[] }> = ({ vehicles }) => (
  <SectionCard title="Phase 2 — Equipment">
    {vehicles.length === 0 ? (
      <Typography variant="body2" sx={{ color: 'text.secondary', py: 1 }}>
        No vehicles registered.
      </Typography>
    ) : (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell>Year / Make / Model</TableCell>
              <TableCell>VIN</TableCell>
              <TableCell align="right">GVWR</TableCell>
              <TableCell>Insurance</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vehicles.map((v, idx) => {
              const yearMakeModel = [v.year, v.make, v.model].filter(Boolean).join(' ');
              const gvwr = typeof v.gvwr === 'number' ? `${v.gvwr.toLocaleString()} lbs` : '—';
              const insured = v.insuranceAttested ? 'Attested' : 'Not attested';

              return (
                <TableRow key={String(v.vin ?? idx)}>
                  <TableCell>{String(v.category ?? '—')}</TableCell>
                  <TableCell>{yearMakeModel || '—'}</TableCell>
                  <TableCell>{String(v.vin ?? '—')}</TableCell>
                  <TableCell align="right">{gvwr}</TableCell>
                  <TableCell>
                    <Chip
                      label={insured}
                      size="small"
                      color={v.insuranceAttested ? 'success' : 'warning'}
                      variant="outlined"
                      sx={{ height: 22, fontSize: '0.75rem' }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    )}
  </SectionCard>
);

const DriversSection: React.FC<{ drivers: Record<string, unknown>[] }> = ({ drivers }) => (
  <SectionCard title="Phase 3 — Drivers">
    {drivers.length === 0 ? (
      <Typography variant="body2" sx={{ color: 'text.secondary', py: 1 }}>
        No additional drivers registered.
      </Typography>
    ) : (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Pay Type</TableCell>
              <TableCell align="right">Pay Rate</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {drivers.map((d, idx) => {
              const name = [d.firstName, d.lastName].filter(Boolean).join(' ');
              const payRate =
                typeof d.payRate === 'number'
                  ? d.payType === 'PERCENTAGE'
                    ? `${d.payRate}%`
                    : formatCurrency(d.payRate)
                  : '—';

              return (
                <TableRow key={String(d.email ?? idx)}>
                  <TableCell>{name || '—'}</TableCell>
                  <TableCell>{String(d.phone ?? '—')}</TableCell>
                  <TableCell>{String(d.email ?? '—')}</TableCell>
                  <TableCell>{String(d.payType ?? '—')}</TableCell>
                  <TableCell align="right">{payRate}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    )}
  </SectionCard>
);

const CostAnalysisSection: React.FC<{ costAnalysis?: CostAnalysisResult }> = ({
  costAnalysis,
}) => (
  <SectionCard title="Phase 4 — Cost Analysis">
    {!costAnalysis ? (
      <Typography variant="body2" sx={{ color: 'text.secondary', py: 1 }}>
        Cost analysis not yet completed.
      </Typography>
    ) : (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 2,
        }}
      >
        {[
          { label: 'Break-Even RPM', value: formatRpm(costAnalysis.breakEvenRpm) },
          { label: 'Min Rate / Mile', value: formatRpm(costAnalysis.minimumRatePerMile) },
          {
            label: 'Monthly Expenses',
            value: formatCurrency(costAnalysis.totalMonthlyExpenses),
          },
          { label: 'Fuel Cost / Mile', value: formatRpm(costAnalysis.fuelCostPerMile) },
          {
            label: 'Projected Net / Month',
            value: formatCurrency(costAnalysis.projectedNetPerMonth),
          },
          { label: 'Revenue / Mile', value: formatRpm(costAnalysis.revenuePerMile) },
        ].map((item) => (
          <Box
            key={item.label}
            sx={{
              textAlign: 'center',
              py: 1.5,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {item.value}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {item.label}
            </Typography>
          </Box>
        ))}
      </Box>
    )}
  </SectionCard>
);

const LanePreferencesSection: React.FC<{
  lanePreferences?: CarrierOnboardingDetail['lanePreferences'];
}> = ({ lanePreferences }) => {
  if (!lanePreferences) {
    return (
      <SectionCard title="Phase 5 — Lane Preferences">
        <Typography variant="body2" sx={{ color: 'text.secondary', py: 1 }}>
          Lane preferences not yet completed.
        </Typography>
      </SectionCard>
    );
  }

  const homeBase = [lanePreferences.homeBaseCity, lanePreferences.homeBaseState]
    .filter(Boolean)
    .join(', ');

  const lanes: LanePreferenceEntry[] = lanePreferences.preferredLanes ?? [];
  const statePrefs: StatePreferenceEntry[] = lanePreferences.statePreferences ?? [];
  const freightPrefs: string[] = lanePreferences.freightPreferences ?? [];

  const nonNeutralStates = statePrefs.filter((sp) => sp.preference !== 'NEUTRAL');

  return (
    <SectionCard title="Phase 5 — Lane Preferences">
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <FieldRow label="Home Base" value={homeBase} />
          <FieldRow
            label="Max Days Out"
            value={
              lanePreferences.maxDaysOut !== undefined && lanePreferences.maxDaysOut !== null
                ? String(lanePreferences.maxDaysOut)
                : null
            }
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FieldRow
            label="Freight Prefs"
            value={
              freightPrefs.length > 0 ? (
                <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                  {freightPrefs.map((fp) => (
                    <Chip
                      key={fp}
                      label={fp.replace(/_/g, ' ')}
                      size="small"
                      variant="outlined"
                      sx={{ height: 22, fontSize: '0.75rem' }}
                    />
                  ))}
                </Stack>
              ) : null
            }
          />
        </Grid>
      </Grid>

      {/* Preferred Lanes */}
      {lanes.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
            Preferred Lanes
          </Typography>
          <Stack spacing={0.5}>
            {lanes.map((lane, idx) => (
              <Typography key={idx} variant="body2">
                {lane.origin ?? '—'} &rarr; {lane.destination ?? '—'}
              </Typography>
            ))}
          </Stack>
        </Box>
      )}

      {/* State Grid (non-neutral only) */}
      {nonNeutralStates.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
            State Preferences
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
            {nonNeutralStates.map((sp) => (
              <Chip
                key={sp.state}
                label={`${sp.state}: ${sp.preference}`}
                size="small"
                color={STATE_PREF_COLORS[sp.preference] ?? 'default'}
                variant="outlined"
                sx={{ height: 22, fontSize: '0.75rem' }}
              />
            ))}
          </Stack>
        </Box>
      )}
    </SectionCard>
  );
};

const DocumentsSection: React.FC<{ documents: PortalDocument[] }> = ({ documents }) => (
  <SectionCard title="Phase 6 — Documents">
    {documents.length === 0 ? (
      <Typography variant="body2" sx={{ color: 'text.secondary', py: 1 }}>
        No documents uploaded.
      </Typography>
    ) : (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>File Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Signed</TableCell>
              <TableCell>Uploaded</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell>{doc.documentType.replace(/_/g, ' ')}</TableCell>
                <TableCell>{doc.fileName ?? '—'}</TableCell>
                <TableCell>
                  <Chip
                    label={REVIEW_STATUS_LABELS[doc.reviewStatus] ?? doc.reviewStatus}
                    size="small"
                    color={REVIEW_STATUS_COLORS[doc.reviewStatus] ?? 'default'}
                    variant="outlined"
                    sx={{ height: 22, fontSize: '0.75rem' }}
                  />
                </TableCell>
                <TableCell>
                  {doc.signedAt ? new Date(doc.signedAt).toLocaleDateString() : '—'}
                </TableCell>
                <TableCell>{new Date(doc.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    )}
  </SectionCard>
);

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

const OnboardingSkeleton: React.FC = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
    {Array.from({ length: 6 }).map((_, i) => (
      <Skeleton key={i} variant="rounded" height={120} />
    ))}
  </Box>
);

// ---------------------------------------------------------------------------
// Main tab component
// ---------------------------------------------------------------------------

export const OnboardingTab: React.FC<OnboardingTabProps> = ({
  carrierId,
  carrierName,
  onStatusChanged,
}) => {
  const [data, setData] = useState<CarrierOnboardingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const fetchOnboarding = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getCarrierOnboardingDetail(carrierId)
      .then((result) => {
        if (!cancelled) {
          setData(result);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load onboarding data';
          setError(message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [carrierId]);

  useEffect(() => {
    const cleanup = fetchOnboarding();
    return cleanup;
  }, [fetchOnboarding]);

  const handleApproved = useCallback(() => {
    onStatusChanged?.();
    fetchOnboarding();
  }, [onStatusChanged, fetchOnboarding]);

  const handleRejected = useCallback(() => {
    onStatusChanged?.();
    fetchOnboarding();
  }, [onStatusChanged, fetchOnboarding]);

  if (loading) {
    return <OnboardingSkeleton />;
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        No onboarding data available.
      </Alert>
    );
  }

  const isCompleted = Boolean(data.session?.completedAt);
  const displayName = carrierName ?? String(data.carrier.name ?? 'Carrier');
  const minimumRatePerMile = data.costAnalysis?.minimumRatePerMile ?? null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {isCompleted && (
        <Stack direction="row" spacing={1.5} sx={{ mb: 0.5 }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircleOutline />}
            onClick={() => setApproveOpen(true)}
          >
            Approve
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<CancelOutlined />}
            onClick={() => setRejectOpen(true)}
          >
            Reject
          </Button>
        </Stack>
      )}

      <CompanySection carrier={data.carrier} />
      <EquipmentSection vehicles={data.vehicles} />
      <DriversSection drivers={data.drivers} />
      <CostAnalysisSection costAnalysis={data.costAnalysis} />
      <LanePreferencesSection lanePreferences={data.lanePreferences} />
      <DocumentsSection documents={data.documents} />

      <ApproveCarrierDialog
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        carrierId={carrierId}
        carrierName={displayName}
        minimumRatePerMile={minimumRatePerMile}
        onApproved={handleApproved}
      />
      <RejectCarrierDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        carrierId={carrierId}
        carrierName={displayName}
        onRejected={handleRejected}
      />
    </Box>
  );
};
