import React, { useState, useEffect, ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Box,
  Typography,
  Button,
  Card,
  Divider,
  Chip,
  IconButton,
  Grid,
  Stack,
  Tooltip,
  Avatar,
  Tab,
  Tabs,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useDispatch, useSelector } from 'store';
import { FieldRow } from '../../components/FieldRow';
import { DataGuard, PageWrapper } from '@mocho/ui/components';
import { EditableSectionHeader } from '../../components/EditableSectionHeader';
import { CARRIER_DETAIL_TAB_ITEMS as tabItems } from '../../constants';
import { selectFormattedCarrierById } from '../../store/selectors/carrierSelectors';
import {
  fetchCarrierDetailsRequest,
  carrierPageSelectors,
} from '../../store/reducers/carrierNewPageSlice';
import { useDrawerActions } from '../../../ui/hooks/useDrawerActions';
// import { InnerPageHeader } from '../../../../components/InnerPageHeader';

interface InnerPageHeaderProps {
  onBack: () => void;
  backLabel: string;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  // children: React.ReactNode;
}

export const InnerPageHeader = ({
  onBack,
  backLabel,
  title,
  subtitle,
  actions,
}: InnerPageHeaderProps) => {
  return (
    <Box
      sx={{
        backgroundColor: 'background.paper',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mt: 1,
        mb: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          size="small"
          sx={{ color: 'primary.main' }}
        >
          {backLabel}
        </Button>
        <Divider orientation="vertical" flexItem />
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {typeof title === 'string' ? (
              <Typography variant="h5" color="text.primary">
                {title}
              </Typography>
            ) : (
              title
            )}
            {/* <StatusBadge
                  status={carrier.status}
                  onChange={(s) => handleUpdate({ status: s })}
                /> */}
          </Box>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>

      {actions && (
        <Stack direction="row" spacing={1}>
          {actions}
        </Stack>
      )}
    </Box>
  );
};

type CarrierDetailTitleProps = {
  title: string;
  subTitle: string;
} & ({ avatarSrc: string; initials?: never } | { initials: string; avatarSrc?: never });

const CarrierDetailTitle = ({ title, subTitle, avatarSrc, initials }: CarrierDetailTitleProps) => (
  <>
    <Avatar
      src={avatarSrc}
      sx={{
        width: 36,
        height: 36,
        bgcolor: 'primary.light',
        color: 'primary.main',
        fontWeight: 700,
        fontSize: 14,
      }}
    >
      {initials}
    </Avatar>
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Typography variant="h5">{title}</Typography>
        <Chip label="active" />
      </Box>
      <Typography variant="body2" color="text.secondary">
        {subTitle}
      </Typography>
    </Box>
  </>
);

const CarrierDetailsActions = ({
  carrierId: _carrierId,
  handleEdit,
}: {
  carrierId: string;
  handleEdit: () => void;
}) => (
  <Stack direction="row" spacing={1}>
    <Button variant="contained">Dispatch Load</Button>
    <Button variant="outlined" startIcon={<EditIcon />} onClick={handleEdit}>
      Edit
    </Button>
  </Stack>
);

const CarrierKPI = (c) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'grey.50',
      }}
    >
      {[
        { label: 'MC / DOT', primary: c.mcNumber, secondary: c.dotNumber },
        { label: 'CONTACT', primary: c.phone ?? '—', secondary: c.email ?? '—' },
        {
          label: 'DISPATCH FEE',
          primary: `${c.dispatchFeePercent}%`,
          secondary: c.partnerSplitPercent ? `${c.partnerSplitPercent}% partner split` : '',
        },
        { label: 'DRIVERS', primary: '2', secondary: '1 available, 1 at delivery' },
        {
          label: 'LIFETIME REVENUE',
          primary: '$12,800',
          secondary: '8 loads',
          highlight: true,
        },
        {
          label: 'COI EXPIRES',
          primary: 'Aug 30, 2026',
          secondary: '152 days remaining',
          highlightGreen: true,
        },
      ].map((kpi, i) => (
        <Box
          key={kpi.label}
          sx={{
            px: 2.5,
            py: 1.5,
            borderRight: i < 5 ? 1 : 0,
            borderColor: 'divider',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              color: 'text.disabled',
              fontSize: '0.625rem',
            }}
          >
            {kpi.label}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              color: kpi.highlight || kpi.highlightGreen ? 'success.main' : 'text.primary',
              mt: 0.5,
            }}
          >
            {kpi.primary}
          </Typography>
          <Typography variant="caption">{kpi.secondary}</Typography>
        </Box>
      ))}
    </Box>
  );
};

const CarrierDetailEditable: React.FC = () => {
  // const [carrier, setCarrier] = useState<CarrierData>(MOCK_CARRIER);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { openDrawer } = useDrawerActions();
  const { id } = useParams();
  const carrier = useSelector(selectFormattedCarrierById(id));
  const isLoading = useSelector(carrierPageSelectors.selectIsEntityLoading('getById', id ?? ''));
  const isError = useSelector(
    (state) => !!carrierPageSelectors.selectEntityError('getById', id ?? '')(state),
  );

  useEffect(() => {
    if (id) {
      dispatch(fetchCarrierDetailsRequest({ id }));
    }
  }, [dispatch, id]);

  const handleBack = () => {
    navigate('/carriers');
  };

  // const handleUpdate = (patch: Partial<CarrierData>) => {
  //   setCarrier((prev) => ({ ...prev, ...patch }));
  //   // In production: dispatch Redux action or API call
  // };

  return (
    <PageWrapper isLoading={isLoading} isError={isError} errorContext="CarrierDetailPage">
      <DataGuard data={carrier} emptyComponent={<Typography p={4}>Carrier not found.</Typography>}>
        {(c) => {
          return (
            <>
              <Box
                sx={{
                  px: 4,
                  pt: 2,
                  bgcolor: 'background.paper',
                  borderBottom: 1,
                  borderColor: 'divider',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                }}
              >
                <InnerPageHeader
                  onBack={handleBack}
                  backLabel="Carriers"
                  title={
                    <CarrierDetailTitle
                      title={c.name}
                      subTitle="External Carrier"
                      initials={c.name
                        .split(' ')
                        .map((w) => w[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    />
                  }
                  actions={
                    <CarrierDetailsActions
                      carrierId={c.id}
                      handleEdit={() => openDrawer('carrierCompanyInfo', { carrierId: c.id })}
                    />
                  }
                />

                <CarrierKPI c={c} />

                <Box
                  sx={{
                    marginTop: 1,
                  }}
                >
                  <Tabs
                    value={activeTab}
                    onChange={(_event, value: string) => setActiveTab(value)}
                    variant="scrollable"
                    allowScrollButtonsMobile
                    sx={{ minHeight: 44 }}
                  >
                    {tabItems.map((tab) => (
                      <Tab
                        key={tab.key}
                        value={tab.key}
                        sx={{ minHeight: 44 }}
                        label={
                          <Stack direction="row" spacing={0.75} alignItems="center">
                            <Typography variant="body2">{tab.label}</Typography>
                            {tab.count !== undefined && (
                              <Chip
                                label={tab.count}
                                size="small"
                                variant="outlined"
                                sx={{ height: 18 }}
                              />
                            )}
                          </Stack>
                        }
                      />
                    ))}
                  </Tabs>
                </Box>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 320px',
                  gap: 2.5,
                  p: 3,
                  maxWidth: 1200,
                }}
              >
                {/* Left Column */}
                <Stack spacing={2}>
                  {/* Company Information Card */}
                  <Card>
                    <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
                      <EditableSectionHeader
                        title="Company Information"
                        onEdit={() => openDrawer('carrierCompanyInfo', { carrierId: c.id })}
                      />
                    </Box>
                    <Box sx={{ px: 3, py: 2 }}>
                      <Grid container>
                        <Grid item xs={6}>
                          <FieldRow label="Legal Name" value={c.name} />
                          <FieldRow label="DOT Number" value={c.dotNumber} />
                          <FieldRow label="Phone" value={c.phone} />
                          <FieldRow label="Email" value={c.email} isLink />
                        </Grid>
                        <Grid item xs={6}>
                          <FieldRow label="MC Number" value={c.mcNumber} />
                          <FieldRow label="Address" value={c.address} />
                        </Grid>
                      </Grid>
                    </Box>
                  </Card>

                  {/* Performance Card (read-only) */}
                  <Card>
                    <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.9375rem' }}
                      >
                        Performance (All Time)
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        px: 3,
                        py: 2.5,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: 2,
                      }}
                    >
                      {[
                        { value: '8', label: 'Total Loads' },
                        { value: '$12,800', label: 'Revenue', color: 'success.main' },
                        { value: '$3.85', label: 'Avg Rate/Mi', color: 'success.main' },
                        { value: '100%', label: 'On-Time %' },
                        { value: '2.4', label: 'Avg Days Out' },
                      ].map((stat) => (
                        <Box
                          key={stat.label}
                          sx={{
                            textAlign: 'center',
                            py: 1.5,
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                          }}
                        >
                          <Typography
                            variant="h5"
                            sx={{ fontWeight: 700, color: stat.color || 'text.primary' }}
                          >
                            {stat.value}
                          </Typography>
                          <Typography variant="caption">{stat.label}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Card>

                  {/* FMCSA Verification (read-only) */}
                  <Card>
                    <Box
                      sx={{
                        px: 3,
                        py: 2,
                        borderBottom: 1,
                        borderColor: 'divider',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.9375rem' }}
                      >
                        🔍 FMCSA Verification
                      </Typography>
                      <Chip
                        label="COMING SOON"
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.625rem', height: 22 }}
                      />
                    </Box>
                    <Box sx={{ px: 3, py: 2 }}>
                      <Grid container spacing={1}>
                        {[
                          'Authority Status',
                          'Safety Rating',
                          'Inspections',
                          'Insurance on File',
                          'Crash History',
                          'Out of Service %',
                        ].map((field) => (
                          <Grid item xs={6} key={field}>
                            <Box
                              sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}
                            >
                              <Typography variant="body2" color="text.disabled">
                                {field}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ color: 'warning.main', fontWeight: 500 }}
                              >
                                — Pending
                              </Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </Card>
                </Stack>

                {/* Right Column (Sidebar Cards) */}
                <Stack spacing={2}>
                  {/* Dispatch Terms */}
                  <Card
                    sx={{
                      bgcolor: 'grey.900',
                      color: '#fff',
                      '& .MuiTypography-root': { color: 'inherit' },
                    }}
                  >
                    <Box
                      sx={{
                        px: 2.5,
                        py: 2,
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          fontSize: '0.6875rem',
                        }}
                      >
                        Dispatch Terms
                      </Typography>
                      <Tooltip title="Edit dispatch terms">
                        <IconButton
                          size="small"
                          onClick={() => openDrawer('carrierDispatchTerms', { carrierId: c.id })}
                          sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#fff' } }}
                        >
                          <EditIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Box sx={{ px: 2.5, py: 2 }}>
                      {[
                        {
                          label: 'Dispatch Fee',
                          value: `${c.dispatchFeePercent}%`,
                          highlight: true,
                        },
                        {
                          label: 'Partner Split',
                          value: c.partnerSplitPercent ? `${c.partnerSplitPercent}%` : '—',
                        },
                        {
                          label: 'Agreement',
                          value: c.dispatchAgreementOnFile ? 'On File' : '—',
                        },
                      ].map((row) => (
                        <Box
                          key={row.label}
                          sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}
                        >
                          <Typography variant="body2" sx={{ opacity: 0.6 }}>
                            {row.label}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 700, color: row.highlight ? '#3b82f6' : '#fff' }}
                          >
                            {row.value}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Card>

                  {/* Onboarding Checklist (read-only) */}
                  <Card>
                    <Box sx={{ px: 2.5, py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <CheckIcon sx={{ color: 'success.main', fontSize: 20 }} />
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600, color: 'success.main' }}
                        >
                          Onboarding Complete
                        </Typography>
                      </Box>
                      {[
                        'Dispatch Agreement',
                        'Certificate of Insurance',
                        'W-9',
                        'MC/DOT Verified',
                      ].map((item) => (
                        <Typography
                          key={item}
                          variant="body2"
                          sx={{ py: 0.25, color: 'text.secondary' }}
                        >
                          ✓ {item}
                        </Typography>
                      ))}
                    </Box>
                  </Card>

                  {/* <InlineEditableNotes
            value={carrier.notes}
            author={carrier.notesAuthor}
            date={carrier.notesDate}
            onSave={(notes) =>
              handleUpdate({
                notes,
                notesAuthor: 'Jr',
                notesDate: new Date().toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                }),
              })
            }
          /> */}
                </Stack>
              </Box>
            </>
          );
        }}
      </DataGuard>
    </PageWrapper>
  );
};

export default CarrierDetailEditable;
