import { Box, Stack } from '@mui/material';

import { BodyMuted, KpiLabel, PageTitle, SectionTitle } from 'components/Typography';

import PortalShell from '../../../components/PortalShell';
import PortalNavActions from '../../../components/PortalNavActions';
import PortalStepper, {
  type PortalStepperPhase,
} from '../../../components/PortalStepper';
import PortalStepperMobile from '../../../components/PortalStepperMobile';
import PortalFooterBar from '../../../components/PortalFooterBar';
import ToggleCardGrid from '../../../components/ToggleCardGrid';

const PHASE_LABELS = ['Company', 'Equipment', 'Drivers', 'Costs', 'Preferences', 'Documents'];

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

const PlaceholderBody: React.FC<{ phase: string }> = ({ phase }) => (
  <Box
    sx={{
      width: '100%',
      maxWidth: 640,
      bgcolor: 'background.paper',
      border: '1px solid',
      borderColor: 'grey.200',
      borderRadius: 1,
      boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
      p: 4,
    }}
  >
    <KpiLabel sx={{ color: 'primary.main', mb: 1, display: 'block' }}>{phase}</KpiLabel>
    <PageTitle sx={{ mb: 1, fontSize: 22 }}>Form body slot</PageTitle>
    <BodyMuted sx={{ fontSize: 14, mb: 3 }}>
      Each phase&apos;s questions render here inside an OnboardingCard. This shell preview shows
      the chrome only.
    </BodyMuted>
    <Box
      sx={{
        border: '2px dashed',
        borderColor: 'grey.200',
        borderRadius: 1,
        py: 4,
        textAlign: 'center',
        color: 'text.secondary',
        fontSize: 13,
      }}
    >
      Form body slot
    </Box>
  </Box>
);

const phasesWithStates = (
  states: PortalStepperPhase['state'][],
): PortalStepperPhase[] =>
  PHASE_LABELS.map((label, index) => ({
    id: label.toLowerCase(),
    label,
    state: states[index] ?? 'pending',
  }));

const noop = () => undefined;

const PortalShellPreview: React.FC = () => {
  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto', p: { xs: 2, md: 4 }, bgcolor: 'grey.200' }}>
      <Box sx={{ mb: 4 }}>
        <KpiLabel>Carrier portal · chrome reference</KpiLabel>
        <PageTitle sx={{ mb: 1 }}>portal-shell</PageTitle>
        <BodyMuted sx={{ fontSize: 13 }}>
          Source: <code>docs/screenshots/mockups/onboarding/portal-shell.html</code> (chrome
          conflicts resolved per newer mockups: Save&nbsp;&amp;&nbsp;Exit in nav, Back/Continue in
          sticky footer, no &quot;Question N&quot; eyebrow, save state baked into footer
          location-meta).
        </BodyMuted>
      </Box>

      <Stack spacing={1.5} sx={{ mb: 3 }}>
        <SectionTitle>Stepper state matrix</SectionTitle>
        <BodyMuted sx={{ fontSize: 13 }}>
          5 per-phase states: pending / active / done / locked / locked-viewing. Connector turns
          green when its left phase is done, locked, or locked-viewing.
        </BodyMuted>
      </Stack>

      <StateFrame label="State A · Welcome → Company active (no completion yet)">
        <PortalShell
          headerActions={<PortalNavActions onSaveExit={noop} />}
          stepper={
            <PortalStepper phases={phasesWithStates(['active', 'pending', 'pending', 'pending', 'pending', 'pending'])} />
          }
          footer={
            <PortalFooterBar
              phaseLabel="Company"
              metaText="Step 1 of 6 · MC authority"
              onBack={noop}
              onContinue={noop}
              continueDisabled
            />
          }
        >
          <PlaceholderBody phase="Company" />
        </PortalShell>
      </StateFrame>

      <StateFrame label="State B · Equipment active · Company done">
        <PortalShell
          headerActions={<PortalNavActions onSaveExit={noop} />}
          stepper={
            <PortalStepper phases={phasesWithStates(['done', 'active', 'pending', 'pending', 'pending', 'pending'])} />
          }
          footer={
            <PortalFooterBar
              phaseLabel="Equipment"
              metaText="Step 2 of 6 · at least 1 vehicle required"
              helperText="Add at least 1 vehicle to continue"
              onBack={noop}
              onContinue={noop}
              continueDisabled
            />
          }
        >
          <PlaceholderBody phase="Equipment" />
        </PortalShell>
      </StateFrame>

      <StateFrame label="State C · Drivers active · Company + Equipment done · Continue enabled">
        <PortalShell
          headerActions={<PortalNavActions onSaveExit={noop} />}
          stepper={
            <PortalStepper phases={phasesWithStates(['done', 'done', 'active', 'pending', 'pending', 'pending'])} />
          }
          footer={
            <PortalFooterBar
              phaseLabel="Drivers"
              metaText="Step 3 of 6 · 2 drivers configured"
              onBack={noop}
              onContinue={noop}
            />
          }
        >
          <PlaceholderBody phase="Drivers" />
        </PortalShell>
      </StateFrame>

      <StateFrame label="State D · post-signature · everything locked · viewing Company">
        <PortalShell
          headerActions={<PortalNavActions onSaveExit={noop} />}
          stepper={
            <PortalStepper
              phases={phasesWithStates([
                'locked-viewing',
                'locked',
                'locked',
                'locked',
                'locked',
                'locked',
              ])}
            />
          }
          footer={
            <PortalFooterBar
              phaseLabel="Company · locked"
              metaText="Read-only after dispatch agreement signed"
              onBack={noop}
              backLabel="Back to summary"
              onContinue={noop}
              continueLabel="Continue"
            />
          }
        >
          <PlaceholderBody phase="Company · locked" />
        </PortalShell>
      </StateFrame>

      <StateFrame label="State E · Continue is loading (submit in flight)">
        <PortalShell
          headerActions={<PortalNavActions onSaveExit={noop} />}
          stepper={
            <PortalStepper phases={phasesWithStates(['done', 'active', 'pending', 'pending', 'pending', 'pending'])} />
          }
          footer={
            <PortalFooterBar
              phaseLabel="Equipment"
              metaText="Submitting…"
              onBack={noop}
              onContinue={noop}
              isContinuing
            />
          }
        >
          <PlaceholderBody phase="Equipment" />
        </PortalShell>
      </StateFrame>

      <Box sx={{ mt: 5 }}>
        <SectionTitle sx={{ mb: 1 }}>Mobile stepper (collapsed)</SectionTitle>
        <BodyMuted sx={{ fontSize: 13, mb: 2 }}>
          On viewports &lt; 768 px the full stepper collapses into a single row with a progress
          bar. The desktop stepper is hidden via responsive sx, so both render conditionally.
        </BodyMuted>
        <Box
          sx={{
            maxWidth: 420,
            mx: 0,
            p: 2,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'grey.200',
            borderRadius: 1.5,
          }}
        >
          <PortalStepperMobile
            activePhaseLabel="Equipment"
            activePhaseNumber={2}
            totalPhases={6}
            progressPercent={25}
            subText="✓ Company complete · Drivers next"
          />
        </Box>
      </Box>

      <Box sx={{ mt: 5 }}>
        <SectionTitle sx={{ mb: 1 }}>Yes/No toggle (ToggleCardGrid)</SectionTitle>
        <BodyMuted sx={{ fontSize: 13, mb: 2 }}>
          Radio top-left, content stacked to the right. Same selected-state styling as
          SelectionCardGrid via shared helper. Renders default + selected + locked states.
        </BodyMuted>
        <Stack spacing={2}>
          <Box>
            <KpiLabel sx={{ mb: 1, display: 'block' }}>Default (no selection)</KpiLabel>
            <ToggleCardGrid
              options={[
                { id: 'yes', label: 'Yes, I have MC', subline: 'Authority issued by FMCSA' },
                { id: 'no', label: "No, I don't", subline: 'Intrastate / box truck / not yet' },
              ]}
              value={null}
              onChange={noop}
            />
          </Box>
          <Box>
            <KpiLabel sx={{ mb: 1, display: 'block' }}>Yes selected</KpiLabel>
            <ToggleCardGrid
              options={[
                { id: 'yes', label: 'Yes, I have MC', subline: 'Authority issued by FMCSA' },
                { id: 'no', label: "No, I don't", subline: 'Intrastate / box truck / not yet' },
              ]}
              value="yes"
              onChange={noop}
            />
          </Box>
          <Box>
            <KpiLabel sx={{ mb: 1, display: 'block' }}>Compact (size=sm) · DBA nested toggle</KpiLabel>
            <ToggleCardGrid
              options={[
                { id: 'yes', label: 'Yes' },
                { id: 'no', label: 'No' },
              ]}
              value="no"
              onChange={noop}
              size="sm"
            />
          </Box>
          <Box>
            <KpiLabel sx={{ mb: 1, display: 'block' }}>Locked (post-signature) · Yes was selected</KpiLabel>
            <ToggleCardGrid
              options={[
                { id: 'yes', label: 'Yes, I have MC', subline: 'Authority issued by FMCSA' },
                { id: 'no', label: "No, I don't" },
              ]}
              value="yes"
              onChange={noop}
              locked
            />
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};

export default PortalShellPreview;
