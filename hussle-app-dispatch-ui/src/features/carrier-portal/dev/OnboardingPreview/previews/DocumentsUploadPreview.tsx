import { Box, Button, IconButton, Link, Tooltip } from '@mui/material';
import {
  AddOutlined,
  CameraAltOutlined,
  CloseOutlined,
  DeleteOutline,
  DescriptionOutlined,
  InfoOutlined,
  RefreshOutlined,
  RemoveRedEyeOutlined,
  UploadFileOutlined,
} from '@mui/icons-material';

import { Body, BodyMuted, KpiLabel, PageTitle } from 'components/Typography';

import PortalShell from '../../../components/PortalShell';
import PortalNavActions from '../../../components/PortalNavActions';
import PortalStepper, {
  type PortalStepperPhase,
} from '../../../components/PortalStepper';
import PortalFooterBar from '../../../components/PortalFooterBar';
import OnboardingCard from '../../../components/OnboardingCard';
import ProgressStrip from '../../../components/ProgressStrip';
import UploadZone from '../../../components/UploadZone';
import UploadDropArea from '../../../components/UploadDropArea';
import UploadFileRow from '../../../components/UploadFileRow';
import FileThumb from '../../../components/FileThumb';

const PHASE_LABELS = ['Company', 'Equipment', 'Drivers', 'Costs', 'Preferences', 'Documents'];

const STEPPER_AT_DOCS: PortalStepperPhase[] = PHASE_LABELS.map((label, index) => {
  if (index === 5) return { id: label.toLowerCase(), label, state: 'active' };
  return { id: label.toLowerCase(), label, state: 'done' };
});

const noop = () => undefined;

// ---------------------------------------------------------------------------
// Helper buttons (preview-only)
// ---------------------------------------------------------------------------

const DropActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}> = ({ icon, label, onClick }) => (
  <Button
    variant="outlined"
    color="inherit"
    onClick={onClick}
    startIcon={icon}
    sx={{
      textTransform: 'none',
      fontWeight: 600,
      fontSize: 12.5,
      borderColor: 'grey.200',
      color: 'text.primary',
      bgcolor: 'background.paper',
      px: 1.5,
      py: 0.875,
      borderRadius: 0.75,
      '& .MuiButton-startIcon': { mr: 0.625, '& svg': { fontSize: 13 } },
      '&:hover': { bgcolor: 'grey.100', borderColor: 'grey.300' },
    }}
  >
    {label}
  </Button>
);

const FileActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}> = ({ icon, label, onClick }) => (
  <Button
    variant="outlined"
    color="inherit"
    onClick={onClick}
    startIcon={icon}
    sx={{
      textTransform: 'none',
      fontWeight: 600,
      fontSize: 12.5,
      borderColor: 'grey.200',
      color: 'text.primary',
      bgcolor: 'background.paper',
      px: 1.375,
      py: 0.875,
      borderRadius: 0.75,
      '& .MuiButton-startIcon': { mr: 0.625, '& svg': { fontSize: 13 } },
      '&:hover': { bgcolor: 'grey.50', borderColor: 'grey.300' },
    }}
  >
    {label}
  </Button>
);

const RetryButton: React.FC<{ label: string; onClick?: () => void }> = ({ label, onClick }) => (
  <Button
    variant="contained"
    color="error"
    onClick={onClick}
    startIcon={<RefreshOutlined sx={{ fontSize: 13 }} />}
    sx={{
      textTransform: 'none',
      fontWeight: 600,
      fontSize: 12.5,
      px: 1.375,
      py: 0.875,
      borderRadius: 0.75,
      bgcolor: 'error.main',
      '&:hover': { bgcolor: 'error.dark' },
      '& .MuiButton-startIcon': { mr: 0.625 },
    }}
  >
    {label}
  </Button>
);

const DangerIconButton: React.FC<{
  icon: React.ReactNode;
  ariaLabel: string;
  onClick?: () => void;
}> = ({ icon, ariaLabel, onClick }) => (
  <Tooltip title={ariaLabel} arrow placement="top">
    <IconButton
      onClick={onClick}
      aria-label={ariaLabel}
      sx={{
        width: 32,
        height: 32,
        border: '1px solid',
        borderColor: 'rgba(254, 202, 202, 1)',
        borderRadius: 0.75,
        color: 'error.main',
        '&:hover': { bgcolor: 'rgba(254, 242, 242, 1)' },
        '& svg': { fontSize: 16 },
      }}
    >
      {icon}
    </IconButton>
  </Tooltip>
);

// ---------------------------------------------------------------------------
// Reused content (per-zone metadata)
// ---------------------------------------------------------------------------

const fileFormatMeta = (
  <>
    <DescriptionOutlined sx={{ fontSize: 12 }} />
    PDF, JPG, or PNG · 10 MB max
  </>
);

const HelpNote: React.FC = () => (
  <Box
    sx={{
      mt: 2,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 1,
      px: 1.75,
      py: 1.25,
      bgcolor: 'grey.50',
      border: '1px solid',
      borderColor: 'grey.200',
      borderRadius: 0.75,
    }}
  >
    <Box
      sx={{
        color: 'text.secondary',
        mt: 0.25,
        flexShrink: 0,
        '& svg': { fontSize: 14 },
      }}
    >
      <InfoOutlined />
    </Box>
    <Body sx={{ fontSize: 12.5, color: 'text.secondary', lineHeight: 1.5 }}>
      <strong>Tip:</strong> A clear phone photo works fine — just make sure all four corners and
      text are readable. We can&apos;t accept screenshots of emails or partial pages.
    </Body>
  </Box>
);

// ---------------------------------------------------------------------------
// Empty drop areas (parameterized)
// ---------------------------------------------------------------------------

const EmptyDropArea: React.FC<{ docLabel: string; showCameraOption?: boolean }> = ({
  docLabel,
  showCameraOption = true,
}) => (
  <UploadDropArea
    title={
      <>
        Drag and drop your {docLabel} here, or{' '}
        <Box
          component="span"
          sx={{
            color: 'primary.main',
            textDecoration: 'underline',
            textUnderlineOffset: '3px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          browse files
        </Box>
      </>
    }
    subtitle="PDF, JPG, or PNG · up to 10 MB"
    actions={
      <>
        <DropActionButton icon={<AddOutlined />} label="Browse" onClick={noop} />
        {showCameraOption ? (
          <DropActionButton icon={<CameraAltOutlined />} label="Use phone camera" onClick={noop} />
        ) : null}
      </>
    }
  />
);

// ---------------------------------------------------------------------------
// Pre-canned zone bodies for each state
// ---------------------------------------------------------------------------

const CoiEmptyZone: React.FC = () => (
  <UploadZone
    state="empty"
    zoneNumber={1}
    name="Certificate of Insurance (COI)"
    tag={{ label: 'Required', variant: 'required' }}
    description="Shows your required coverage minimums — auto liability, cargo, and general liability. Should list FleetCommand Inc as certificate holder."
    metaLeft={fileFormatMeta}
  >
    <EmptyDropArea docLabel="COI" />
  </UploadZone>
);

const W9EmptyZone: React.FC = () => (
  <UploadZone
    state="empty"
    zoneNumber={2}
    name="W-9 Form"
    tag={{ label: 'Required', variant: 'required' }}
    description="IRS form W-9 (Rev. October 2018 or later) showing your taxpayer ID. Required for year-end 1099 filing."
    metaLeft={fileFormatMeta}
    metaRight={
      <Link
        href="#"
        sx={{ fontSize: 12, fontWeight: 600, color: 'primary.main', textDecoration: 'none' }}
        onClick={(e) => e.preventDefault()}
      >
        Don&apos;t have one? Download IRS blank →
      </Link>
    }
  >
    <EmptyDropArea docLabel="W-9" />
  </UploadZone>
);

const CoiUploadingZone: React.FC = () => (
  <UploadZone
    state="uploading"
    name="Certificate of Insurance (COI)"
    tag={{ label: 'Uploading', variant: 'working' }}
    description="Shows your required coverage minimums and lists FleetCommand Inc as certificate holder."
  >
    <UploadFileRow
      state="uploading"
      thumbnail={<FileThumb format="pdf" />}
      filename="COI-Mocho-Solutions-2026.pdf"
      meta={
        <>
          <Box component="span">2.4 MB of 3.6 MB</Box>
          <Box component="span" sx={{ color: 'grey.300', fontSize: 11 }}>
            ·
          </Box>
          <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>
            67% · about 4s left
          </Box>
        </>
      }
      progressPercent={67}
      actions={
        <DangerIconButton
          icon={<CloseOutlined />}
          ariaLabel="Cancel upload"
          onClick={noop}
        />
      }
    />
  </UploadZone>
);

const CoiUploadedZone: React.FC<{ uploadedTime?: string }> = ({
  uploadedTime = 'Uploaded 2026-05-16 · 11:14 ET',
}) => (
  <UploadZone
    state="uploaded"
    name="Certificate of Insurance (COI)"
    tag={{ label: 'Uploaded', variant: 'ok' }}
    description="Auto-checked: lists FleetCommand Inc as certificate holder, valid through 2027-03-14."
  >
    <UploadFileRow
      state="uploaded"
      thumbnail={<FileThumb format="pdf" />}
      filename="COI-Mocho-Solutions-2026.pdf"
      meta={
        <>
          <Box component="span">3.6 MB</Box>
          <Box component="span" sx={{ color: 'grey.300', fontSize: 11 }}>
            ·
          </Box>
          <Box component="span">{uploadedTime}</Box>
        </>
      }
      actions={
        <>
          <FileActionButton icon={<RemoveRedEyeOutlined />} label="View" onClick={noop} />
          <FileActionButton icon={<UploadFileOutlined />} label="Replace" onClick={noop} />
          <DangerIconButton icon={<DeleteOutline />} ariaLabel="Remove" onClick={noop} />
        </>
      }
    />
  </UploadZone>
);

const W9ErrorZone: React.FC = () => (
  <UploadZone
    state="error"
    name="W-9 Form"
    tag={{ label: 'Upload failed', variant: 'err' }}
    description="Your file was 14.2 MB — max is 10 MB. Try the IRS PDF directly, or take a clear photo."
  >
    <UploadFileRow
      state="error"
      thumbnail={<FileThumb format="pdf" error />}
      filename="W-9-scan-marcus-williams.pdf"
      errorText="14.2 MB · exceeds 10 MB limit"
      actions={
        <>
          <RetryButton label="Try another file" onClick={noop} />
          <DangerIconButton
            icon={<CloseOutlined />}
            ariaLabel="Remove"
            onClick={noop}
          />
        </>
      }
    />
  </UploadZone>
);

const W9UploadedZone: React.FC = () => (
  <UploadZone
    state="uploaded"
    name="W-9 Form"
    tag={{ label: 'Uploaded', variant: 'ok' }}
    description="Auto-read TIN matches the one you entered earlier — XX-1234567."
  >
    <UploadFileRow
      state="uploaded"
      thumbnail={<FileThumb format="jpg" />}
      filename="w9-photo-2026-05-16.jpg"
      meta={
        <>
          <Box component="span">1.8 MB</Box>
          <Box component="span" sx={{ color: 'grey.300', fontSize: 11 }}>
            ·
          </Box>
          <Box component="span">Uploaded 11:18 ET</Box>
        </>
      }
      actions={
        <>
          <FileActionButton icon={<RemoveRedEyeOutlined />} label="View" onClick={noop} />
          <FileActionButton icon={<UploadFileOutlined />} label="Replace" onClick={noop} />
        </>
      }
    />
  </UploadZone>
);

// ---------------------------------------------------------------------------
// State containers
// ---------------------------------------------------------------------------

interface StateContainerProps {
  cardTitle: string;
  cardSubtitle: string;
  progress: {
    title: string;
    subtitle: string;
    value: number;
    total: number;
    complete?: boolean;
  };
  footerMeta: string;
  footerHelper?: string;
  finishEnabled?: boolean;
  children: React.ReactNode;
  showHelpNote?: boolean;
}

const PageContainer: React.FC<StateContainerProps> = ({
  cardTitle,
  cardSubtitle,
  progress,
  footerMeta,
  footerHelper,
  finishEnabled = false,
  children,
  showHelpNote = false,
}) => (
  <PortalShell
    headerActions={<PortalNavActions onSaveExit={noop} />}
    stepper={<PortalStepper phases={STEPPER_AT_DOCS} />}
    footer={
      <PortalFooterBar
        phaseLabel="Documents · upload"
        metaText={footerMeta}
        helperText={footerHelper}
        onBack={noop}
        onContinue={noop}
        continueLabel="Finish onboarding"
        continueDisabled={!finishEnabled}
      />
    }
  >
    <OnboardingCard phase="Documents · upload" title={cardTitle} subtitle={cardSubtitle} width="lg">
      <ProgressStrip
        title={progress.title}
        subtitle={progress.subtitle}
        value={progress.value}
        total={progress.total}
        variant={progress.complete ? 'complete' : 'progress'}
      />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>{children}</Box>

      {showHelpNote ? <HelpNote /> : null}
    </OnboardingCard>
  </PortalShell>
);

const StateA: React.FC = () => (
  <PageContainer
    cardTitle="Last step — upload two documents."
    cardSubtitle="We need your Certificate of Insurance and W-9 to finalize onboarding. Drag and drop, or browse from your phone or laptop."
    progress={{
      title: '0 of 2 uploaded',
      subtitle: 'Both files are required to finish. PDF, JPG, or PNG — 10 MB max.',
      value: 0,
      total: 2,
    }}
    footerMeta="2 required · both PDF / JPG / PNG up to 10 MB"
    footerHelper="Continue unlocks after both uploads"
    showHelpNote
  >
    <CoiEmptyZone />
    <W9EmptyZone />
  </PageContainer>
);

const StateB: React.FC = () => (
  <PageContainer
    cardTitle="Last step — upload two documents."
    cardSubtitle="We need your Certificate of Insurance and W-9 to finalize onboarding."
    progress={{
      title: '0 of 2 uploaded · 1 in progress',
      subtitle: "Hang tight — we'll auto-advance once both files are ready.",
      value: 0,
      total: 2,
    }}
    footerMeta="COI uploading · 1 more file to go"
    footerHelper="Continue unlocks when both files arrive"
  >
    <CoiUploadingZone />
    <W9EmptyZone />
  </PageContainer>
);

const StateC: React.FC = () => (
  <PageContainer
    cardTitle="Last step — upload two documents."
    cardSubtitle="We need your Certificate of Insurance and W-9 to finalize onboarding."
    progress={{
      title: '1 of 2 uploaded · 1 needs attention',
      subtitle: 'W-9 upload failed — retry with a smaller file.',
      value: 1,
      total: 2,
    }}
    footerMeta="1 of 2 uploaded · W-9 failed (file too large)"
  >
    <CoiUploadedZone />
    <W9ErrorZone />
  </PageContainer>
);

const StateD: React.FC = () => (
  <PortalShell
    headerActions={<PortalNavActions onSaveExit={noop} />}
    stepper={<PortalStepper phases={STEPPER_AT_DOCS} />}
    footer={
      <PortalFooterBar
        phaseLabel="Documents · upload"
        metaText="2 of 2 uploaded · submitting will send to dispatcher review"
        onBack={noop}
        onContinue={noop}
        continueLabel="Finish onboarding"
      />
    }
  >
    <OnboardingCard
      phase="Documents · upload"
      title="Everything's in."
      subtitle="Both documents uploaded — tap Finish onboarding to submit for dispatcher review."
      width="lg"
    >
      <ProgressStrip
        title="2 of 2 uploaded"
        subtitle="Auto-checked. Ready to submit."
        value={2}
        total={2}
        variant="complete"
      />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
        <CoiUploadedZone uploadedTime="Uploaded 11:14 ET" />
        <W9UploadedZone />
      </Box>
    </OnboardingCard>
  </PortalShell>
);

// ---------------------------------------------------------------------------
// Preview index
// ---------------------------------------------------------------------------

interface StateFrameProps {
  label: string;
  children: React.ReactNode;
}

const StateFrame: React.FC<StateFrameProps> = ({ label, children }) => (
  <Box sx={{ mb: 4 }}>
    <KpiLabel sx={{ mb: 1.25, display: 'block' }}>{label}</KpiLabel>
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'grey.200',
        borderRadius: 1.5,
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
      }}
    >
      {children}
    </Box>
  </Box>
);

const DocumentsUploadPreview: React.FC = () => (
  <Box sx={{ maxWidth: 1280, mx: 'auto', p: { xs: 2, md: 4 }, bgcolor: 'grey.200' }}>
    <Box sx={{ mb: 4 }}>
      <KpiLabel>Carrier portal · Documents phase · upload step</KpiLabel>
      <PageTitle sx={{ mb: 1 }}>documents-upload</PageTitle>
      <BodyMuted sx={{ fontSize: 13 }}>
        Source: <code>docs/screenshots/mockups/onboarding/documents-upload.html</code>. Two zones
        (COI + W-9) rendered via a single <code>UploadZone</code> primitive that handles all four
        states (empty / uploading / uploaded / error). Note: current v2 spec only requires COI;
        the W-9 zone is shown to exercise the primitives.
      </BodyMuted>
    </Box>

    <StateFrame label="State A · both empty">
      <StateA />
    </StateFrame>

    <StateFrame label="State B · COI uploading 67% · W-9 still empty">
      <StateB />
    </StateFrame>

    <StateFrame label="State C · COI uploaded · W-9 failed (file too large)">
      <StateC />
    </StateFrame>

    <StateFrame label="State D · both uploaded · Finish onboarding enabled">
      <StateD />
    </StateFrame>
  </Box>
);

export default DocumentsUploadPreview;
