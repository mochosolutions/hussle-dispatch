import React, { useState } from 'react';
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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { FieldRow } from '../../components/FieldRow';
import { EditableSectionHeader } from '../../components/EditableSectionHeader';
import { DispatchTermsDrawer } from '../../components/DispatchTermsDrawer';
import { CompanyInfoDrawer } from '../../components/CompanyInfoDrawer';
import { InlineEditableNotes } from '../../components/InlineEditableNotes';
import { StatusBadge } from '../../components/StatusBadge';
import { EQUIPMENT_OPTIONS } from '../../constants';
import { CarrierData } from '../../types';
import { useNavigate } from 'react-router';

const MOCK_CARRIER: CarrierData = {
  id: 'C-1001',
  legalName: 'JR Express LLC',
  mcNumber: 'MC-1234567',
  dotNumber: 'DOT-9876543',
  address: '789 Carrier Way, Elizabeth, NJ 07201',
  contactName: 'Jr Rodriguez',
  contactPhone: '(555) 123-4567',
  contactEmail: 'jr@jrexpress.com',
  equipmentTypes: ['dry_van', 'flatbed'],
  status: 'approved',
  dispatchFee: 10,
  partnerSplit: 50,
  paymentTerms: 'Net 30',
  agreementDate: '2026-01-15',
  notes:
    'Reliable carrier, mostly runs NJ→Southeast lanes. Has been growing fleet — may add a third truck Q2.',
  notesAuthor: 'Jr',
  notesDate: 'Feb 10, 2026',
};

const CarrierDetailEditable: React.FC = () => {
  const [carrier, setCarrier] = useState<CarrierData>(MOCK_CARRIER);
  const [companyDrawerOpen, setCompanyDrawerOpen] = useState(false);
  const [termsDrawerOpen, setTermsDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const handleUpdate = (patch: Partial<CarrierData>) => {
    setCarrier((prev) => ({ ...prev, ...patch }));
    // In production: dispatch Redux action or API call
  };

  const eqLabels = carrier.equipmentTypes
    .map((v) => EQUIPMENT_OPTIONS.find((e) => e.value === v)?.label)
    .filter(Boolean)
    .join(', ');

  return (
    <Box>
      <Box
        sx={{ px: 4, py: 2, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => {
                navigate('/carriers');
              }}
              size="small"
              sx={{ color: 'primary.main' }}
            >
              Carriers
            </Button>
            <Divider orientation="vertical" flexItem />
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: 'primary.light',
                color: 'primary.main',
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {carrier.legalName
                .split(' ')
                .map((w) => w[0])
                .join('')
                .slice(0, 2)}
            </Avatar>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="h5">{carrier.legalName}</Typography>
                <StatusBadge
                  status={carrier.status}
                  onChange={(s) => handleUpdate({ status: s })}
                />
              </Box>
              <Typography variant="caption">External Carrier</Typography>
            </Box>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="contained">Dispatch Load</Button>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setCompanyDrawerOpen(true)}
            >
              Edit
            </Button>
          </Stack>
        </Box>

        {/* KPI Strip */}
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
            { label: 'MC / DOT', primary: carrier.mcNumber, secondary: carrier.dotNumber },
            { label: 'CONTACT', primary: carrier.contactName, secondary: carrier.contactPhone },
            {
              label: 'DISPATCH FEE',
              primary: `${carrier.dispatchFee}%`,
              secondary: `${carrier.partnerSplit}% partner split`,
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
      </Box>

      {/* ─── Content Area ────────────────────────────────────── */}
      <Box
        sx={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 2.5, p: 3, maxWidth: 1200 }}
      >
        {/* Left Column */}
        <Stack spacing={2}>
          {/* Company Information Card */}
          <Card>
            <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
              <EditableSectionHeader
                title="Company Information"
                onEdit={() => setCompanyDrawerOpen(true)}
              />
            </Box>
            <Box sx={{ px: 3, py: 2 }}>
              <Grid container>
                <Grid item xs={6}>
                  <FieldRow label="Legal Name" value={carrier.legalName} />
                  <FieldRow label="DOT Number" value={carrier.dotNumber} />
                  <FieldRow label="Contact" value={carrier.contactName} />
                  <FieldRow label="Email" value={carrier.contactEmail} isLink />
                </Grid>
                <Grid item xs={6}>
                  <FieldRow label="MC Number" value={carrier.mcNumber} />
                  <FieldRow label="Address" value={carrier.address} />
                  <FieldRow label="Phone" value={carrier.contactPhone} />
                  <FieldRow label="Equipment" value={eqLabels} />
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                      <Typography variant="body2" color="text.disabled">
                        {field}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 500 }}>
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
                  onClick={() => setTermsDrawerOpen(true)}
                  sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#fff' } }}
                >
                  <EditIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ px: 2.5, py: 2 }}>
              {[
                { label: 'Dispatch Fee', value: `${carrier.dispatchFee}%`, highlight: true },
                { label: 'Partner Split', value: `${carrier.partnerSplit}%` },
                { label: 'Payment Terms', value: carrier.paymentTerms },
                {
                  label: 'Agreement',
                  value: carrier.agreementDate
                    ? `Signed ${new Date(carrier.agreementDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : '—',
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
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'success.main' }}>
                  Onboarding Complete
                </Typography>
              </Box>
              {['Dispatch Agreement', 'Certificate of Insurance', 'W-9', 'MC/DOT Verified'].map(
                (item) => (
                  <Typography key={item} variant="body2" sx={{ py: 0.25, color: 'text.secondary' }}>
                    ✓ {item}
                  </Typography>
                ),
              )}
            </Box>
          </Card>

          {/* Notes (inline editable) */}
          <InlineEditableNotes
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
          />
        </Stack>
      </Box>

      {/* ─── Edit Drawers ────────────────────────────────────── */}
      <CompanyInfoDrawer
        open={companyDrawerOpen}
        onClose={() => setCompanyDrawerOpen(false)}
        data={carrier}
        onSave={handleUpdate}
      />
      <DispatchTermsDrawer
        open={termsDrawerOpen}
        onClose={() => setTermsDrawerOpen(false)}
        data={carrier}
        onSave={handleUpdate}
      />
    </Box>
  );
};

export default CarrierDetailEditable;
