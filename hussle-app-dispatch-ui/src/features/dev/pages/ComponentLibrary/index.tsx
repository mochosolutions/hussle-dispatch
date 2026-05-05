import { Box, Divider, Paper, Typography } from '@mui/material';

import TypographySection from './sections/TypographySection';
import ReusableComponentsSection from './sections/ReusableComponentsSection';
import PaletteSection from './sections/PaletteSection';
import StatusChipSection from './sections/StatusChipSection';
import ButtonSection from './sections/ButtonSection';
import SplitButtonSection from './sections/SplitButtonSection';
import CardSection from './sections/CardSection';
import DrawerSectionDemo from './sections/DrawerSection';
import AlertSection from './sections/AlertSection';
import UtilitySection from './sections/UtilitySection';
import StatusBadgeSection from './sections/StatusBadgeSection';

interface SectionWrapperProps {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

const SectionWrapper: React.FC<SectionWrapperProps> = ({ id, title, description, children }) => (
  <Paper id={id} elevation={0} sx={{ p: 4, border: 1, borderColor: 'divider' }}>
    <Typography variant="h3" sx={{ mb: 0.5 }}>
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
      {description}
    </Typography>
    <Divider sx={{ mb: 3 }} />
    {children}
  </Paper>
);

const NAV_ITEMS = [
  { id: 'typography', label: 'Typography Scale' },
  { id: 'components', label: 'Reusable Components' },
  { id: 'palette', label: 'Palette' },
  { id: 'buttons', label: 'Buttons' },
  { id: 'split-button', label: 'Split Button' },
  { id: 'status-chips', label: 'Status Chips' },
  { id: 'cards', label: 'Cards & Rows' },
  { id: 'drawers', label: 'Edit Drawer' },
  { id: 'alerts', label: 'Alerts & Banners' },
  { id: 'utility', label: 'Utility Components' },
  { id: 'status-badges', label: 'Status Badges' },
];

const ComponentLibrary = () => (
  <Box sx={{ maxWidth: 1060, mx: 'auto', px: 4, py: 5 }}>
    <Typography variant="h2" sx={{ mb: 1 }}>
      Component Library
    </Typography>
    <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
      Visual reference for dispatch-ui theme tokens and shared components.
    </Typography>

    <Box
      component="nav"
      sx={{
        display: 'flex',
        gap: 2,
        mb: 4,
        mt: 2,
        flexWrap: 'wrap',
      }}
    >
      {NAV_ITEMS.map((item) => (
        <Typography
          key={item.id}
          component="a"
          href={`#${item.id}`}
          variant="subtitle2"
          sx={{
            color: 'primary.main',
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          {item.label}
        </Typography>
      ))}
    </Box>

    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <SectionWrapper
        id="typography"
        title="Typography Scale"
        description="MUI variant map with Plus Jakarta Sans. Each row shows the resolved theme values."
      >
        <TypographySection />
      </SectionWrapper>

      <SectionWrapper
        id="components"
        title="Reusable Typography Components"
        description="Named components from components/Typography. Import these instead of using raw variant + sx props."
      >
        <ReusableComponentsSection />
      </SectionWrapper>

      <SectionWrapper
        id="palette"
        title="Palette"
        description="Color tokens from the theme. Primary #0552B5, secondary #18981D, grey scale, and semantic colors."
      >
        <PaletteSection />
      </SectionWrapper>

      <SectionWrapper
        id="buttons"
        title="Buttons"
        description="Button variants, colors, sizes, and icon usage. textTransform: none applied globally."
      >
        <ButtonSection />
      </SectionWrapper>

      <SectionWrapper
        id="split-button"
        title="Split Button"
        description="Reusable action dropdown. Two modes: split (selection persists, primary action visible) and menu (single Actions trigger collapsing many actions into one dropdown). Supports icons, dividers, danger items, disabled-with-reason, and icon-only triggers."
      >
        <SplitButtonSection />
      </SectionWrapper>

      <SectionWrapper
        id="status-chips"
        title="Status Chips"
        description="All status chips using the standardized semantic color palette. Filled variant, fontWeight 600."
      >
        <StatusChipSection />
      </SectionWrapper>

      <SectionWrapper
        id="cards"
        title="Cards & Rows"
        description="SectionCard with header, edit button, and DetailRow variants including valueColor, noBorder, and highlight."
      >
        <CardSection />
      </SectionWrapper>

      <SectionWrapper
        id="drawers"
        title="Edit Drawer"
        description="Navy header drawer with DrawerSection groups and footer with Save/Cancel/Discard buttons."
      >
        <DrawerSectionDemo />
      </SectionWrapper>

      <SectionWrapper
        id="alerts"
        title="Alerts & Banners"
        description="ContextualAlert in all 4 severities with left border accent."
      >
        <AlertSection />
      </SectionWrapper>

      <SectionWrapper
        id="utility"
        title="Utility Components"
        description="AvatarChip, ActionMenu, FileUploadRow, and ConfirmDialog — interactive shared components."
      >
        <UtilitySection />
      </SectionWrapper>

      <SectionWrapper
        id="status-badges"
        title="Status Badges"
        description="StatusBadge component — all categories in medium and small sizes."
      >
        <StatusBadgeSection />
      </SectionWrapper>
    </Box>
  </Box>
);

export default ComponentLibrary;
