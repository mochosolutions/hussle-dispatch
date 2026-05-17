import { Link } from 'react-router-dom';
import { Box, Container } from '@mui/material';

import { BodyMuted, PageTitle, SectionTitle } from 'components/Typography';

interface PreviewEntry {
  slug: string;
  title: string;
  source: string;
  status: 'built' | 'pending';
  notes?: string;
}

const PREVIEW_ENTRIES: PreviewEntry[] = [
  {
    slug: 'portal-shell',
    title: 'Portal shell · chrome reference',
    source: 'docs/screenshots/mockups/onboarding/portal-shell.html',
    status: 'built',
    notes:
      'Canonical chrome: nav + stepper (all 5 states) + sticky footer. Plus ToggleCardGrid demo.',
  },
  {
    slug: 'welcome-segmentation',
    title: 'Welcome · segmentation',
    source: 'docs/screenshots/mockups/onboarding/welcome-segmentation.html',
    status: 'built',
    notes: 'Pre-stepper landing. Single question: carrier_type. Migrated to SelectionCardGrid.',
  },
  {
    slug: 'company-authority',
    title: 'Company · MC authority question',
    source: 'docs/screenshots/mockups/onboarding/company-authority-question.html',
    status: 'built',
    notes:
      'Folds mc-authority + mc-entry + (No path) business form in one screen via disclosure. 5 states.',
  },
  {
    slug: 'lane-preferences',
    title: 'Preferences · lanes + schedule + freight types (full)',
    source: 'docs/screenshots/mockups/onboarding/lane-preferences.html',
    status: 'built',
    notes:
      'Two scopes (Fleet default / Per-driver) — 3 sections each (lanes, schedule, freight types). Override badges + reset links surface the inheritance model. Driver chip bar + EditingCallout in per-driver mode.',
  },
  {
    slug: 'equipment-entry',
    title: 'Equipment · vehicle list-builder',
    source: 'docs/screenshots/mockups/onboarding/equipment-entry-and-drivers-list.html',
    status: 'built',
    notes:
      'Empty / inline form / saved-items states. Shared list-builder primitives with Drivers.',
  },
  {
    slug: 'drivers-list',
    title: 'Drivers · driver list-builder',
    source: 'docs/screenshots/mockups/onboarding/equipment-entry-and-drivers-list.html',
    status: 'built',
    notes: 'Same vocabulary as Equipment. Renders only on hasEmployeeDrivers=yes path.',
  },
  {
    slug: 'cost-analysis',
    title: 'Costs · fleet expense calculator',
    source: 'docs/screenshots/mockups/onboarding/cost-analysis.html',
    status: 'built',
    notes:
      'Mode chooser → single-sheet fleet P&L (fixed/variable/assumptions) with live CPM card → skip-confirm. Introduces the LedgerSection / ExpenseRow / AssetPaymentRow / RateCard primitives.',
  },
  {
    slug: 'sign-agreement',
    title: 'Documents · sign agreements (focus mode)',
    source: 'docs/screenshots/mockups/onboarding/sign-agreement.html',
    status: 'built',
    notes:
      'Two modes: list (overview) and focus (signing). Focus mode replaces the stepper with a FocusHeader (back + title + dot trail) and collapses the queue. Introduces ProgressStrip / DocumentRow / DotTrail / FocusHeader / DocuSealStage / FocusFooter.',
  },
  {
    slug: 'documents-upload',
    title: 'Documents · upload (COI + W-9)',
    source: 'docs/screenshots/mockups/onboarding/documents-upload.html',
    status: 'built',
    notes:
      'Four zone states (empty / uploading / uploaded / error) via a single UploadZone primitive. Introduces UploadZone / UploadDropArea / UploadFileRow / FileThumb.',
  },
  {
    slug: 'locked-state',
    title: 'Post-signature · locked Company phase',
    source: 'docs/screenshots/mockups/onboarding/locked-state-demo.html',
    status: 'built',
    notes:
      '3-layer lock pattern: stepper padlocks (Company in locked-viewing) + LockBanner + per-field LockableField + ToggleCardGrid with locked prop. No new primitives — wiring only.',
  },
];

const OnboardingPreviewIndex: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <PageTitle sx={{ mb: 1 }}>Carrier onboarding · preview</PageTitle>
      <BodyMuted sx={{ mb: 4 }}>
        Visual previews for carrier-portal screens. Each entry renders all states from the
        source mockup so the components can be validated before the v2 story wires them up.
      </BodyMuted>

      <SectionTitle sx={{ mb: 2 }}>Screens</SectionTitle>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {PREVIEW_ENTRIES.map((entry) => {
          const isBuilt = entry.status === 'built';
          const content = (
            <Box
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'grey.200',
                borderRadius: 1,
                bgcolor: isBuilt ? 'background.paper' : 'grey.100',
                cursor: isBuilt ? 'pointer' : 'not-allowed',
                opacity: isBuilt ? 1 : 0.6,
                transition: 'all 0.15s ease',
                '&:hover': isBuilt
                  ? {
                      borderColor: 'primary.main',
                      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
                    }
                  : undefined,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <SectionTitle>{entry.title}</SectionTitle>
                <BodyMuted sx={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {entry.status}
                </BodyMuted>
              </Box>
              {entry.notes ? <BodyMuted sx={{ mt: 0.5 }}>{entry.notes}</BodyMuted> : null}
              <BodyMuted sx={{ mt: 0.5, fontSize: 12 }}>
                Source: <code>{entry.source}</code>
              </BodyMuted>
            </Box>
          );

          if (!isBuilt) {
            return <Box key={entry.slug}>{content}</Box>;
          }

          return (
            <Link
              key={entry.slug}
              to={`/dev/onboarding-preview/${entry.slug}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              {content}
            </Link>
          );
        })}
      </Box>
    </Container>
  );
};

export default OnboardingPreviewIndex;
