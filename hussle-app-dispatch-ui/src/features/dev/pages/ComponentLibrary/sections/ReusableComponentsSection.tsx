import { Box, Divider, Stack, Typography } from '@mui/material';
import {
  EntityId,
  AmountDisplay,
  PageTitle,
  DrawerTitle,
  ModalTitle,
  SectionTitle,
  SlideOverId,
  GrossAmount,
  Body,
  BodyStrong,
  BodyMedium,
  BodyMuted,
  Amount,
  LinkText,
  Meta,
  MetaStrong,
  Timestamp,
  WarningText,
  ErrorText,
  SuccessText,
  HintText,
  KpiLabel,
  TableHeaderLabel,
  SectionLabel,
  FieldLabel,
  NavSectionLabel,
  BrandName,
  TwoLineCell,
  KpiCell,
  DetailRow,
} from 'components/Typography';

interface ShowcaseRowProps {
  name: string;
  spec: string;
  children: React.ReactNode;
}

const ShowcaseRow: React.FC<ShowcaseRowProps> = ({ name, spec, children }) => (
  <Box>
    <Stack
      direction="row"
      alignItems="baseline"
      justifyContent="space-between"
      sx={{ py: 1.5 }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
      <Stack direction="row" spacing={2} sx={{ flexShrink: 0, ml: 3, alignItems: 'baseline' }}>
        <Typography
          variant="caption"
          sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'primary.main', minWidth: 140 }}
        >
          {name}
        </Typography>
        <Typography
          variant="caption"
          sx={{ fontFamily: 'monospace', color: 'text.secondary', minWidth: 160 }}
        >
          {spec}
        </Typography>
      </Stack>
    </Stack>
    <Divider />
  </Box>
);

const ReusableComponentsSection = () => (
  <Box>
    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
      Display (h1 — 20px / 800)
    </Typography>
    <ShowcaseRow name="EntityId" spec="h1 · 20px · 800">
      <EntityId>LD-2026-000007</EntityId>
    </ShowcaseRow>
    <ShowcaseRow name="AmountDisplay" spec="h1 · 20px · 800">
      <AmountDisplay>$4,250.00</AmountDisplay>
    </ShowcaseRow>

    <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 3, mb: 2 }}>
      Title (h2 — 18px / 700)
    </Typography>
    <ShowcaseRow name="PageTitle" spec="h2 · 18px · 700">
      <PageTitle>Dispatch Board</PageTitle>
    </ShowcaseRow>
    <ShowcaseRow name="DrawerTitle" spec="h2 · 18px · 700">
      <DrawerTitle>Edit Load Details</DrawerTitle>
    </ShowcaseRow>
    <ShowcaseRow name="ModalTitle" spec="h2 · 18px · 700">
      <ModalTitle>Confirm Deletion</ModalTitle>
    </ShowcaseRow>

    <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 3, mb: 2 }}>
      Subtitle (h3 — 15px / 700)
    </Typography>
    <ShowcaseRow name="SectionTitle" spec="h3 · 15px · 700">
      <SectionTitle>Load Information</SectionTitle>
    </ShowcaseRow>
    <ShowcaseRow name="SlideOverId" spec="h3 · 15px · 700">
      <SlideOverId>INV-2026-0042</SlideOverId>
    </ShowcaseRow>
    <ShowcaseRow name="GrossAmount" spec="h3 · 15px · 700">
      <GrossAmount>$12,450.00</GrossAmount>
    </ShowcaseRow>

    <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 3, mb: 2 }}>
      Body (body1 — 13px / 400)
    </Typography>
    <ShowcaseRow name="Body" spec="body1 · 13px · 400">
      <Body>Pickup at 1200 Industrial Blvd, Dallas TX 75207</Body>
    </ShowcaseRow>
    <ShowcaseRow name="BodyStrong" spec="body1 · 13px · 600">
      <BodyStrong>Newark, NJ</BodyStrong>
    </ShowcaseRow>
    <ShowcaseRow name="BodyMedium" spec="body1 · 13px · 500">
      <BodyMedium>Carrier: Swift Transport LLC</BodyMedium>
    </ShowcaseRow>
    <ShowcaseRow name="BodyMuted" spec="body1 · 13px · secondary">
      <BodyMuted>No notes added yet</BodyMuted>
    </ShowcaseRow>
    <ShowcaseRow name="Amount" spec="body1 · 13px · 600 tabular">
      <Amount>$1,875.00</Amount>
    </ShowcaseRow>
    <ShowcaseRow name="LinkText" spec="body1 · 13px · primary">
      <LinkText>View carrier profile</LinkText>
    </ShowcaseRow>

    <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 3, mb: 2 }}>
      Meta (body2 — 11px / 400)
    </Typography>
    <ShowcaseRow name="Meta" spec="body2 · 11px · secondary">
      <Meta>Mar 16 · 8:14 AM</Meta>
    </ShowcaseRow>
    <ShowcaseRow name="MetaStrong" spec="body2 · 11px · 600">
      <MetaStrong>BOL-2026-0891</MetaStrong>
    </ShowcaseRow>
    <ShowcaseRow name="Timestamp" spec="body2 · 11px · secondary">
      <Timestamp>Updated 3 min ago</Timestamp>
    </ShowcaseRow>
    <ShowcaseRow name="WarningText" spec="body2 · 11px · warning">
      <WarningText>Insurance expires in 30 days</WarningText>
    </ShowcaseRow>
    <ShowcaseRow name="ErrorText" spec="body2 · 11px · error">
      <ErrorText>Payment overdue</ErrorText>
    </ShowcaseRow>
    <ShowcaseRow name="SuccessText" spec="body2 · 11px · success">
      <SuccessText>Delivery confirmed</SuccessText>
    </ShowcaseRow>
    <ShowcaseRow name="HintText" spec="body2 · 11px · italic">
      <HintText>Click a row to view details</HintText>
    </ShowcaseRow>

    <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 3, mb: 2 }}>
      Labels (overline — 10px / 700 / UPPERCASE)
    </Typography>
    <ShowcaseRow name="KpiLabel" spec="overline · 10px · 700">
      <KpiLabel>Pickup</KpiLabel>
    </ShowcaseRow>
    <ShowcaseRow name="TableHeaderLabel" spec="overline · 10px · 700">
      <TableHeaderLabel>Load #</TableHeaderLabel>
    </ShowcaseRow>
    <ShowcaseRow name="SectionLabel" spec="overline · 10px · 700">
      <SectionLabel>Stops</SectionLabel>
    </ShowcaseRow>
    <ShowcaseRow name="FieldLabel" spec="overline · 10px · 700">
      <FieldLabel>Monthly Payment</FieldLabel>
    </ShowcaseRow>
    <ShowcaseRow name="NavSectionLabel" spec="overline · 10px · 700">
      <NavSectionLabel>Fleet Management</NavSectionLabel>
    </ShowcaseRow>
    <ShowcaseRow name="BrandName" spec="overline · 10px · 800">
      <BrandName>Hussle</BrandName>
    </ShowcaseRow>

    <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 3, mb: 2 }}>
      Composite Components
    </Typography>
    <ShowcaseRow name="TwoLineCell" spec="body1 + body2">
      <TwoLineCell primary="Newark, NJ → Dallas, TX" secondary="1,247 mi · Flatbed" />
    </ShowcaseRow>
    <ShowcaseRow name="KpiCell" spec="overline + body1/600">
      <KpiCell label="Revenue" value="$4,250.00" />
    </ShowcaseRow>
    <ShowcaseRow name="DetailRow" spec="body1 label + body1/500 value">
      <DetailRow label="Rate per mile" value="$3.41" />
    </ShowcaseRow>
  </Box>
);

export default ReusableComponentsSection;
