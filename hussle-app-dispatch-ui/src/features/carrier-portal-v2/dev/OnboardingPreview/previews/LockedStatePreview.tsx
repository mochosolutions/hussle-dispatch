import { Box } from '@mui/material';

import { BodyMuted, BodyStrong, KpiLabel, PageTitle } from 'components/Typography';

import PortalShell from '../../../components/PortalShell';
import PortalNavActions from '../../../components/PortalNavActions';
import PortalStepper, {
  type PortalStepperPhase,
} from '../../../components/PortalStepper';
import PortalFooterBar from '../../../components/PortalFooterBar';
import OnboardingCard from '../../../components/OnboardingCard';
import LockBanner from '../../../components/LockBanner';
import LockableField from '../../../components/LockableField';
import FieldLabel from '../../../components/FieldLabel';
import ToggleCardGrid, {
  type ToggleCardOption,
} from '../../../components/ToggleCardGrid';

const PHASE_LABELS = ['Company', 'Equipment', 'Drivers', 'Costs', 'Preferences', 'Documents'];

// All phases locked; Company is `locked-viewing` (blue ring on top of green padlock)
const STEPPER_ALL_LOCKED: PortalStepperPhase[] = PHASE_LABELS.map((label, index) => ({
  id: label.toLowerCase(),
  label,
  state: index === 0 ? 'locked-viewing' : 'locked',
}));

const MC_AUTHORITY_OPTIONS: ToggleCardOption<'yes' | 'no'>[] = [
  { id: 'yes', label: 'Yes, I have MC', subline: 'Authority issued by FMCSA' },
  { id: 'no', label: "No, I don't" },
];

const noop = () => undefined;

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

// ---------------------------------------------------------------------------
// Locked-field section — composes FieldLabel + LockableField
// ---------------------------------------------------------------------------

interface LockedFieldProps {
  id: string;
  label: string;
  value: string;
  prefix?: string;
  mono?: boolean;
  tooltip?: string;
}

const LockedField: React.FC<LockedFieldProps> = ({ id, label, value, prefix, mono, tooltip }) => (
  <Box sx={{ mb: 2 }}>
    <FieldLabel htmlFor={id}>{label}</FieldLabel>
    <LockableField locked value={value} prefix={prefix} mono={mono} tooltip={tooltip}>
      {/* unlocked fallback never used in this preview */}
      <Box id={id} />
    </LockableField>
  </Box>
);

// ---------------------------------------------------------------------------
// State — Looking back at Company after signing
// ---------------------------------------------------------------------------

const StateLocked: React.FC = () => (
  <PortalShell
    headerActions={<PortalNavActions onSaveExit={noop} />}
    stepper={<PortalStepper phases={STEPPER_ALL_LOCKED} />}
    footer={
      <PortalFooterBar
        phaseLabel="Company · locked"
        metaText="Read-only after dispatch agreement signed"
        onBack={noop}
        backLabel="Back to summary"
        onContinue={noop}
      />
    }
  >
    <Box sx={{ width: '100%', maxWidth: 640, mx: 'auto' }}>
      <LockBanner
        title="Signed and locked May 15, 2026 at 11:08 ET"
        body={
          <>
            These fields can&apos;t be edited from here — signing the dispatch agreement locked
            your business identity. Contact your dispatcher to request a change.
          </>
        }
        onRequestChanges={noop}
      />

      <OnboardingCard
        phase="Company"
        title="Your MC authority & business identity"
        subtitle="Here's what you submitted. To amend any field, message your dispatcher and they'll unlock the section for you."
        width="md"
        locked
      >
        <Box sx={{ mb: 2 }}>
          <FieldLabel>Do you have MC authority?</FieldLabel>
          <ToggleCardGrid<'yes' | 'no'>
            options={MC_AUTHORITY_OPTIONS}
            value="yes"
            onChange={noop}
            locked
          />
        </Box>

        <LockedField
          id="mcNumber"
          label="MC number"
          value="1234567"
          prefix="MC-"
          mono
        />

        <LockedField id="legalName" label="Legal name" value="Mocho Solutions Apps LLC" />

        <LockedField
          id="dotNumber"
          label="DOT number"
          value="9876543"
          prefix="DOT-"
          mono
        />

        <LockedField
          id="taxClassification"
          label="Federal tax classification"
          value="Single-member LLC (disregarded entity)"
        />

        <LockedField
          id="signatory"
          label="Signatory"
          value="Marcus Williams · Owner / Member"
        />
      </OnboardingCard>
    </Box>
  </PortalShell>
);

// ---------------------------------------------------------------------------
// Annotation cards explaining the 3 layers
// ---------------------------------------------------------------------------

interface AnnoCardProps {
  number: number;
  title: string;
  body: React.ReactNode;
}

const AnnoCard: React.FC<AnnoCardProps> = ({ number, title, body }) => (
  <Box
    sx={{
      bgcolor: 'background.paper',
      border: '1px solid',
      borderColor: 'grey.200',
      borderRadius: 1,
      p: 1.75,
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
      <Box
        sx={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          bgcolor: 'success.main',
          color: 'common.white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 12,
          flexShrink: 0,
        }}
      >
        {number}
      </Box>
      <BodyStrong sx={{ fontSize: 13, fontWeight: 700 }}>{title}</BodyStrong>
    </Box>
    <BodyMuted sx={{ fontSize: 12.5, lineHeight: 1.55 }}>{body}</BodyMuted>
  </Box>
);

// ---------------------------------------------------------------------------
// Preview index
// ---------------------------------------------------------------------------

const LockedStatePreview: React.FC = () => (
  <Box sx={{ maxWidth: 1280, mx: 'auto', p: { xs: 2, md: 4 }, bgcolor: 'grey.200' }}>
    <Box sx={{ mb: 4 }}>
      <KpiLabel>Carrier portal · post-signature navigation</KpiLabel>
      <PageTitle sx={{ mb: 1 }}>locked-state-demo · three layers</PageTitle>
      <BodyMuted sx={{ fontSize: 13 }}>
        Source: <code>docs/screenshots/mockups/onboarding/locked-state-demo.html</code>. After
        signing the dispatch agreement, completed phases lock. The pattern is layered so the
        carrier sees the lock at multiple distances — stepper-level, banner-level, and
        per-field-level.
      </BodyMuted>
    </Box>

    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        gap: 2,
        mb: 3,
      }}
    >
      <AnnoCard
        number={1}
        title="Stepper padlocks"
        body={
          <>
            Completed phases swap their green check for a green padlock <em>after signature</em>.
            Same position, same color — just communicates &ldquo;you can look, you can&apos;t
            edit.&rdquo;
          </>
        }
      />
      <AnnoCard
        number={2}
        title="Soft banner"
        body={
          <>
            If the carrier taps back into a locked phase, a green banner sits above the card
            explaining <em>when</em> it locked and offering a &ldquo;Request changes&rdquo; CTA
            that routes to the dispatcher.
          </>
        }
      />
      <AnnoCard
        number={3}
        title="Per-field locks"
        body={
          <>
            Every input renders as a read-only value with a lock icon on the right. Hover the icon
            to see why it&apos;s locked. This is what makes locks <em>actionable</em>, not just
            decorative.
          </>
        }
      />
    </Box>

    <StateFrame label="State · carrier signed the agreement, then navigated back to review Company">
      <StateLocked />
    </StateFrame>
  </Box>
);

export default LockedStatePreview;
