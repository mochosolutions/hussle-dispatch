import { Box, Button } from '@mui/material';
import {
  ArrowForwardOutlined,
  CheckCircleOutline,
  DownloadOutlined,
  RemoveRedEyeOutlined,
  TaskAltOutlined,
} from '@mui/icons-material';

import { Body, BodyMuted, BodyStrong, KpiLabel, Meta, PageTitle } from 'components/Typography';

import PortalShell from '../../../components/PortalShell';
import PortalNavActions from '../../../components/PortalNavActions';
import PortalStepper, {
  type PortalStepperPhase,
} from '../../../components/PortalStepper';
import PortalFooterBar from '../../../components/PortalFooterBar';
import OnboardingCard from '../../../components/OnboardingCard';
import ProgressStrip from '../../../components/ProgressStrip';
import DocumentRow from '../../../components/DocumentRow';
import FocusHeader from '../../../components/FocusHeader';
import DocuSealStage from '../../../components/DocuSealStage';
import FocusFooter from '../../../components/FocusFooter';
import { type DotTrailItem } from '../../../components/DotTrail';
import AgreementSignedInterstitial from '../../../components/AgreementSignedInterstitial';
import MockSigningPlaceholder from '../../../components/MockSigningPlaceholder';
import AgreementPrefillSummary from '../../../components/AgreementPrefillSummary';

const PHASE_LABELS = ['Company', 'Equipment', 'Drivers', 'Costs', 'Preferences', 'Documents'];

const STEPPER_AT_DOCS: PortalStepperPhase[] = PHASE_LABELS.map((label, index) => {
  if (index === 5) return { id: label.toLowerCase(), label, state: 'active' };
  return { id: label.toLowerCase(), label, state: 'done' };
});

const noop = () => undefined;

// ---------------------------------------------------------------------------
// Doc action buttons (preview-only compositions)
// ---------------------------------------------------------------------------

const SecondaryDocButton: React.FC<{
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}> = ({ label, icon, onClick }) => (
  <Button
    variant="outlined"
    color="inherit"
    onClick={onClick}
    startIcon={icon}
    sx={{
      textTransform: 'none',
      fontWeight: 600,
      fontSize: 12.5,
      px: 1.5,
      py: 0.875,
      borderRadius: 0.75,
      borderColor: 'grey.200',
      color: 'text.primary',
      '& .MuiButton-startIcon': { mr: 0.625, '& svg': { fontSize: 13 } },
      '&:hover': { bgcolor: 'grey.100', borderColor: 'grey.300' },
    }}
  >
    {label}
  </Button>
);

const PrimarySignButton: React.FC<{ onClick?: () => void; showArrow?: boolean }> = ({
  onClick,
  showArrow = false,
}) => (
  <Button
    variant="contained"
    color="primary"
    onClick={onClick}
    endIcon={showArrow ? <ArrowForwardOutlined sx={{ fontSize: 13 }} /> : undefined}
    sx={{
      textTransform: 'none',
      fontWeight: 600,
      fontSize: 12.5,
      px: 1.75,
      py: 0.875,
      borderRadius: 0.75,
    }}
  >
    Sign now
  </Button>
);

// ---------------------------------------------------------------------------
// State A — Overview
// ---------------------------------------------------------------------------

const StateA: React.FC = () => (
  <PortalShell
    headerActions={<PortalNavActions onSaveExit={noop} />}
    stepper={<PortalStepper phases={STEPPER_AT_DOCS} />}
    footer={
      <PortalFooterBar
        phaseLabel="Documents · sign"
        metaText="1 of 3 required signed · ~7 min remaining"
        helperText="2 more required signatures"
        onBack={noop}
        onContinue={noop}
        continueDisabled
      />
    }
  >
    <OnboardingCard
      phase="Documents · sign"
      title="Sign your onboarding documents."
      subtitle={
        <>
          Four agreements to review and sign. Tap <strong>Sign now</strong> to open one — you&apos;ll
          review it on its own screen, then come back here for the next.
        </>
      }
      width="lg"
    >
      <ProgressStrip
        title="1 of 3 required signed · 2 to go"
        subtitle="Continue unlocks after all required documents are signed."
        value={1}
        total={3}
      />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        <DocumentRow
          state="signed"
          name="Drug & Alcohol Testing Consent"
          tag={{ label: 'Signed', variant: 'signed' }}
          meta={[
            'Marcus Williams',
            <span key="when">2026-05-16 · 10:34 ET</span>,
            <span key="ref">#DS-a91b04</span>,
          ]}
          actions={
            <>
              <SecondaryDocButton
                label="Download"
                icon={<DownloadOutlined />}
                onClick={noop}
              />
              <SecondaryDocButton
                label="View"
                icon={<RemoveRedEyeOutlined />}
                onClick={noop}
              />
            </>
          }
        />

        <DocumentRow
          state="next"
          number={2}
          name="Dispatch Services Agreement"
          tag={{ label: 'Required', variant: 'required' }}
          description="Terms between FleetCommand and your carrier — commission, settlements, termination."
          meta={[
            <Box
              key="upnext"
              component="span"
              sx={{ color: 'primary.main', fontWeight: 600, fontSize: 11.5 }}
            >
              ● Up next
            </Box>,
            <span key="pages">4 pages · ~3 min</span>,
            <span key="locks">Locks business identity</span>,
          ]}
          actions={<PrimarySignButton onClick={noop} showArrow />}
        />

        <DocumentRow
          state="pending"
          number={3}
          name="Broker-Carrier Master Agreement"
          tag={{ label: 'Required', variant: 'required' }}
          description="FMCSA-compliant terms for hauling loads through broker partners."
          meta={[<span key="pages">6 pages</span>, <span key="time">~4 min</span>]}
          actions={<SecondaryDocButton label="Sign now" onClick={noop} />}
        />

        <DocumentRow
          state="pending"
          number={4}
          name="Factoring NOA"
          tag={{ label: 'Optional', variant: 'optional' }}
          description="Notice of Assignment if you use a factoring company — we route payments to them."
          actions={
            <>
              <SecondaryDocButton label="Sign now" onClick={noop} />
              <SecondaryDocButton label="Skip" onClick={noop} />
            </>
          }
        />
      </Box>

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
          <TaskAltOutlined />
        </Box>
        <Body sx={{ fontSize: 12.5, color: 'text.secondary', lineHeight: 1.5 }}>
          <strong>Heads up:</strong> Signing the Dispatch Services Agreement locks your business
          identity — legal name, MC#, DOT#, and signatory.
        </Body>
      </Box>
    </OnboardingCard>
  </PortalShell>
);

// ---------------------------------------------------------------------------
// State B — Focus mode
// ---------------------------------------------------------------------------

const FOCUS_TRAIL: DotTrailItem[] = [
  { id: 'drug-alcohol', state: 'done', tooltip: 'Drug & Alcohol — signed' },
  {
    id: 'dispatch',
    state: 'current',
    tooltip: 'Dispatch Services Agreement — current',
  },
  { id: 'broker', state: 'pending', tooltip: 'Broker-Carrier — pending' },
  { id: 'factoring', state: 'pending', tooltip: 'Factoring NOA — pending' },
];

const MockPdfPage: React.FC = () => (
  <Box
    component="article"
    sx={{
      maxWidth: 620,
      mx: 'auto',
      bgcolor: 'background.paper',
      borderRadius: 0.5,
      boxShadow: '0 4px 16px rgba(15, 23, 42, 0.10)',
      px: { xs: 4, md: 8 },
      py: { xs: 5, md: 7 },
      fontFamily: '"Source Serif 4", Georgia, serif',
      color: 'rgba(31, 41, 55, 1)',
      fontSize: 12,
      lineHeight: 1.6,
    }}
  >
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        pb: 1.75,
        borderBottom: '1px solid',
        borderColor: 'grey.300',
        mb: 2.25,
      }}
    >
      <Box sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700, fontSize: 14 }}>
        DISPATCH SERVICES AGREEMENT
      </Box>
      <Box
        sx={{
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          fontSize: 10.5,
          color: 'text.secondary',
          textAlign: 'right',
          lineHeight: 1.4,
        }}
      >
        FleetCommand Inc.
        <br />
        2026-05-16 · v3.1
      </Box>
    </Box>

    <Box
      component="h1"
      sx={{
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        fontWeight: 700,
        fontSize: 19,
        textAlign: 'center',
        letterSpacing: '-0.01em',
        m: 0,
        mb: 0.5,
      }}
    >
      Dispatch Agreement
    </Box>
    <Box
      sx={{
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        textAlign: 'center',
        fontSize: 11,
        color: 'text.secondary',
        fontWeight: 500,
        mb: 2.5,
      }}
    >
      Between FleetCommand, Inc. and the Carrier identified below
    </Box>

    <Section heading="1. Parties">
      This Dispatch Services Agreement (&ldquo;Agreement&rdquo;) is entered into on{' '}
      <Field>May 16, 2026</Field> by and between <Field>FleetCommand, Inc.</Field>, a Delaware
      corporation (the &ldquo;Dispatcher&rdquo;), and{' '}
      <Field>Mocho Solutions Apps LLC</Field>, holder of operating authority{' '}
      <Field>MC-1234567</Field> / <Field>DOT-9876543</Field> (the &ldquo;Carrier&rdquo;). The
      Carrier is represented by its authorized signatory <Field>Marcus Williams</Field>, serving
      as <Field>Owner / Member</Field>.
    </Section>

    <Section heading="2. Terms">
      The Dispatcher will procure freight on behalf of the Carrier under the Carrier&apos;s
      operating authority, negotiate loads with brokers and shippers, and provide back-office
      support including invoicing and factoring coordination. The Carrier retains full control
      over equipment, drivers, and routing decisions.
      <br />
      <br />
      This Agreement remains in effect on a month-to-month basis and may be terminated by either
      party with thirty (30) days written notice.
    </Section>

    <Section heading="3. Compensation">
      The Dispatcher&apos;s fee is <Field>eight percent (8%)</Field> of the gross line-haul
      revenue per load, deducted at settlement. Settlements run weekly, every{' '}
      <Field>Friday</Field>, with deductions itemized on the Carrier&apos;s pay statement.
    </Section>

    <Box
      sx={{
        mt: 3.25,
        px: 2.75,
        pt: 2.25,
        pb: 2.5,
        border: '1.5px dashed',
        borderColor: 'primary.main',
        background:
          'linear-gradient(90deg, rgba(37,99,235,0.06), rgba(37,99,235,0.02) 70%)',
        borderRadius: 0.75,
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1.4fr 1fr' },
        gap: 3,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -10,
          left: 22,
          bgcolor: 'primary.main',
          color: 'common.white',
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          fontWeight: 700,
          fontSize: 10,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          px: 1.125,
          py: 0.375,
          borderRadius: '999px',
        }}
      >
        Sign here
      </Box>

      <SignatureBlock
        label="Carrier signature"
        lineText="✎ tap to sign"
        meta={
          <>
            <strong>Marcus Williams</strong> · Owner / Member
            <br />
            Mocho Solutions Apps LLC
          </>
        }
      />
      <SignatureBlock
        label="Date"
        lineText="tap to apply"
        meta="Auto-fills to today (2026-05-16)"
      />
    </Box>
  </Box>
);

const Section: React.FC<{ heading: string; children: React.ReactNode }> = ({
  heading,
  children,
}) => (
  <Box sx={{ mt: 2.25 }}>
    <Box
      component="h2"
      sx={{
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        fontWeight: 700,
        fontSize: 11.5,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        m: 0,
        mb: 1,
      }}
    >
      {heading}
    </Box>
    <Body sx={{ fontSize: 12, lineHeight: 1.6 }}>{children}</Body>
  </Box>
);

const Field: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box
    component="span"
    sx={{
      bgcolor: 'rgba(254, 249, 195, 1)',
      px: 0.5,
      borderRadius: 0.25,
      borderBottom: '1.5px solid',
      borderColor: 'rgba(250, 204, 21, 1)',
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontWeight: 600,
      color: 'rgba(66, 32, 6, 1)',
      fontSize: 11.5,
    }}
  >
    {children}
  </Box>
);

const SignatureBlock: React.FC<{
  label: string;
  lineText: string;
  meta: React.ReactNode;
}> = ({ label, lineText, meta }) => (
  <Box>
    <Meta
      sx={{
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        mb: 1,
      }}
    >
      {label}
    </Meta>
    <Box
      sx={{
        borderBottom: '1px solid',
        borderColor: 'text.primary',
        minHeight: 34,
        mb: 0.75,
        display: 'flex',
        alignItems: 'flex-end',
        pb: 0.5,
        fontFamily: '"Source Serif 4", Georgia, serif',
        color: 'text.secondary',
        fontStyle: 'italic',
        fontSize: 11,
      }}
    >
      {lineText}
    </Box>
    <Body
      sx={{
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        fontSize: 11,
        color: 'text.secondary',
        lineHeight: 1.4,
      }}
    >
      {meta}
    </Body>
  </Box>
);

const StateB: React.FC = () => (
  <PortalShell
    headerActions={<PortalNavActions onSaveExit={noop} />}
    stepper={
      <FocusHeader
        onBack={noop}
        eyebrow="Document 2 of 4 · Required"
        title="Dispatch Services Agreement"
        trail={FOCUS_TRAIL}
      />
    }
    footer={
      <FocusFooter
        lockNote="Signing locks your business identity"
        onSaveClose={noop}
        onSignComplete={noop}
      />
    }
  >
    <Box sx={{ width: '100%' }}>
      <DocuSealStage pageLabel="Page 1 of 4" onDownload={noop} onZoom={noop} onHelp={noop}>
        <MockPdfPage />
      </DocuSealStage>
    </Box>
  </PortalShell>
);

// ---------------------------------------------------------------------------
// State C — All signed
// ---------------------------------------------------------------------------

const CompleteBanner: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      px: 2.5,
      py: 2.25,
      background: 'linear-gradient(90deg, #ecfdf5 0%, #f0fdf4 50%, #fff 100%)',
      border: '1px solid',
      borderColor: 'rgba(187, 247, 208, 1)',
      borderLeft: '3px solid',
      borderLeftColor: 'success.main',
      borderRadius: 0.75,
      mb: 2.25,
    }}
  >
    <Box
      sx={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        bgcolor: 'success.main',
        color: 'common.white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        '& svg': { fontSize: 24 },
      }}
    >
      <CheckCircleOutline />
    </Box>
    <Box sx={{ flex: 1, lineHeight: 1.4 }}>
      <BodyStrong sx={{ fontSize: 16, fontWeight: 700, color: 'rgba(6, 78, 59, 1)', mb: 0.25 }}>
        All required documents signed.
      </BodyStrong>
      <Body sx={{ fontSize: 13, color: 'rgba(20, 83, 45, 1)' }}>
        3 of 3 required complete · 1 optional skipped.
      </Body>
    </Box>
    <Button
      variant="contained"
      onClick={noop}
      startIcon={<DownloadOutlined sx={{ fontSize: 14 }} />}
      sx={{
        textTransform: 'none',
        fontWeight: 600,
        fontSize: 13,
        bgcolor: 'success.main',
        color: 'common.white',
        px: 1.75,
        py: 1.125,
        borderRadius: 0.75,
        flexShrink: 0,
        '&:hover': { bgcolor: 'success.dark' },
      }}
    >
      Download all (.zip)
    </Button>
  </Box>
);

const StateC: React.FC = () => (
  <PortalShell
    headerActions={<PortalNavActions onSaveExit={noop} />}
    stepper={<PortalStepper phases={STEPPER_AT_DOCS} />}
    footer={
      <PortalFooterBar
        phaseLabel="Documents · signed"
        metaText="3 of 3 required complete · proceeding to upload"
        onBack={noop}
        onContinue={noop}
        continueLabel="Continue to upload"
      />
    }
  >
    <OnboardingCard
      phase="Documents · sign"
      title="Everything signed."
      subtitle="Copies are saved to your dispatcher's records and to your account. Download them any time."
      width="lg"
    >
      <CompleteBanner />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        <DocumentRow
          state="signed"
          name="Dispatch Services Agreement"
          tag={{ label: 'Signed', variant: 'signed' }}
          meta={[
            'Marcus Williams',
            <span key="when">2026-05-16 · 11:08 ET</span>,
            <span key="ref">#DS-48a2c91</span>,
          ]}
          actions={
            <>
              <SecondaryDocButton
                label="Download"
                icon={<DownloadOutlined />}
                onClick={noop}
              />
              <SecondaryDocButton
                label="View"
                icon={<RemoveRedEyeOutlined />}
                onClick={noop}
              />
            </>
          }
        />
        <DocumentRow
          state="signed"
          name="Broker-Carrier Master Agreement"
          tag={{ label: 'Signed', variant: 'signed' }}
          meta={[
            'Marcus Williams',
            <span key="when">2026-05-16 · 11:02 ET</span>,
            <span key="ref">#DS-48a2c92</span>,
          ]}
          actions={
            <>
              <SecondaryDocButton
                label="Download"
                icon={<DownloadOutlined />}
                onClick={noop}
              />
              <SecondaryDocButton
                label="View"
                icon={<RemoveRedEyeOutlined />}
                onClick={noop}
              />
            </>
          }
        />
        <DocumentRow
          state="signed"
          name="Drug & Alcohol Testing Consent"
          tag={{ label: 'Signed', variant: 'signed' }}
          meta={[
            'Marcus Williams',
            <span key="when">2026-05-16 · 10:34 ET</span>,
          ]}
          actions={
            <>
              <SecondaryDocButton
                label="Download"
                icon={<DownloadOutlined />}
                onClick={noop}
              />
              <SecondaryDocButton
                label="View"
                icon={<RemoveRedEyeOutlined />}
                onClick={noop}
              />
            </>
          }
        />
        <DocumentRow
          state="skipped"
          name="Factoring NOA"
          tag={{ label: 'Skipped', variant: 'skipped' }}
          description="You can come back anytime from your dashboard."
          actions={<SecondaryDocButton label="Sign now" onClick={noop} />}
        />
      </Box>
    </OnboardingCard>
  </PortalShell>
);

// ---------------------------------------------------------------------------
// Preview index
// ---------------------------------------------------------------------------
// State D — Success interstitial (just-signed handoff to next agreement)
// ---------------------------------------------------------------------------

const StateD: React.FC = () => (
  <PortalShell
    headerActions={<PortalNavActions onSaveExit={noop} />}
    stepper={
      <FocusHeader
        onBack={noop}
        eyebrow="Document 2 of 4 · Signed"
        title="Dispatch Services Agreement"
        trail={[
          { id: 'drug-alcohol', state: 'done', tooltip: 'Drug & Alcohol — signed' },
          { id: 'dispatch', state: 'done', tooltip: 'Dispatch Services Agreement — signed' },
          { id: 'broker', state: 'current', tooltip: 'Broker-Carrier — up next' },
          { id: 'factoring', state: 'pending', tooltip: 'Factoring NOA — pending' },
        ]}
      />
    }
  >
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', py: 4 }}>
      <AgreementSignedInterstitial
        signedAt="2026-05-16T15:08:00Z"
        signedAgreementName="Dispatch Services Agreement"
        nextAgreementName="Broker-Carrier Master Agreement"
        onAutoAdvance={noop}
        onBackToList={noop}
        // Disable auto-advance inside the dev preview so reviewers can
        // actually look at the frame without it disappearing.
        autoAdvanceMs={0}
      />
    </Box>
  </PortalShell>
);

// ---------------------------------------------------------------------------
// State E — Focus mode with mock placeholder + prefill summary (dev-only)
// ---------------------------------------------------------------------------

const StateE: React.FC = () => (
  <PortalShell
    headerActions={<PortalNavActions onSaveExit={noop} />}
    stepper={
      <FocusHeader
        onBack={noop}
        eyebrow="Document 2 of 4 · Mock mode"
        title="Dispatch Services Agreement"
        trail={FOCUS_TRAIL}
      />
    }
    footer={
      <FocusFooter
        lockNote="Signing locks your business identity"
        onSaveClose={noop}
        onSignComplete={noop}
      />
    }
  >
    <Box
      sx={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 280px' },
        gap: 2,
        alignItems: 'start',
      }}
    >
      <DocuSealStage pageLabel="Mock mode" onDownload={noop} onZoom={noop} onHelp={noop}>
        <MockSigningPlaceholder onMarkSigned={noop} />
      </DocuSealStage>
      <Box sx={{ position: { md: 'sticky' }, top: { md: 16 } }}>
        <AgreementPrefillSummary
          variables={{
            carrier_legal_name: 'Mocho Solutions Apps LLC',
            mc_number: 'MC-1234567',
            dot_number: 'DOT-9876543',
            dispatcher_org_name: 'FleetCommand Inc.',
            effective_date: '2026-05-16',
          }}
        />
      </Box>
    </Box>
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

const SignAgreementPreview: React.FC = () => {
  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto', p: { xs: 2, md: 4 }, bgcolor: 'grey.200' }}>
      <Box sx={{ mb: 4 }}>
        <KpiLabel>Carrier portal · Documents phase · sign step</KpiLabel>
        <PageTitle sx={{ mb: 1 }}>sign-agreement</PageTitle>
        <BodyMuted sx={{ fontSize: 13 }}>
          Source: <code>docs/screenshots/mockups/onboarding/sign-agreement.html</code>. Focus
          principle: when signing, the document is the only thing on screen. The 6-phase stepper
          is replaced by a minimal FocusHeader, and the queue collapses to a 4-dot trail.
        </BodyMuted>
      </Box>

      <StateFrame label="State A · overview · pick a document to sign">
        <StateA />
      </StateFrame>

      <StateFrame label="State B · focus mode · stepper replaced; document is the only thing on screen">
        <StateB />
      </StateFrame>

      <StateFrame label="State C · all required signed · downloads available">
        <StateC />
      </StateFrame>

      <StateFrame label="State D · success interstitial · just-signed handoff to next agreement">
        <StateD />
      </StateFrame>

      <StateFrame label="State E · focus mode + mock placeholder · dev-only signing escape hatch">
        <StateE />
      </StateFrame>
    </Box>
  );
};

export default SignAgreementPreview;
