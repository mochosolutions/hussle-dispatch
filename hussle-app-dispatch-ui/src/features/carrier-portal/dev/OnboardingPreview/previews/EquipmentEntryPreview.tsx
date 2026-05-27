import { useState } from 'react';
import { useFormik } from 'formik';
import { Box } from '@mui/material';
import { LocalShipping, RvHookup, DirectionsCar } from '@mui/icons-material';

import { TextField } from '@mocho/ui/components';

import { BodyMuted, KpiLabel, PageTitle } from 'components/Typography';

import PortalShell from '../../../components/PortalShell';
import PortalNavActions from '../../../components/PortalNavActions';
import PortalStepper, {
  type PortalStepperPhase,
} from '../../../components/PortalStepper';
import PortalFooterBar from '../../../components/PortalFooterBar';
import OnboardingCard from '../../../components/OnboardingCard';
import SelectionCardGrid, {
  type SelectionCardOption,
} from '../../../components/SelectionCardGrid';
import ListBuilderHeader from '../../../components/ListBuilderHeader';
import ListBuilderEmptyState from '../../../components/ListBuilderEmptyState';
import ListBuilderItem from '../../../components/ListBuilderItem';
import ListBuilderAddMoreButton from '../../../components/ListBuilderAddMoreButton';
import ListBuilderInlineForm from '../../../components/ListBuilderInlineForm';
import FieldGroupLabel from '../../../components/FieldGroupLabel';
import Callout from '../../../components/Callout';

const PHASE_LABELS = ['Company', 'Equipment', 'Drivers', 'Costs', 'Preferences', 'Documents'];

const STEPPER_AT_EQUIPMENT: PortalStepperPhase[] = PHASE_LABELS.map((label, index) => {
  if (index === 0) return { id: label.toLowerCase(), label, state: 'done' };
  if (index === 1) return { id: label.toLowerCase(), label, state: 'active' };
  return { id: label.toLowerCase(), label, state: 'pending' };
});

type VehicleCategory = 'semi' | 'box' | 'cargo_van' | 'personal';

const CATEGORY_OPTIONS: SelectionCardOption<VehicleCategory>[] = [
  { id: 'semi', icon: <LocalShipping />, title: 'Semi-truck' },
  { id: 'box', icon: <LocalShipping />, title: 'Box truck' },
  { id: 'cargo_van', icon: <RvHookup />, title: 'Cargo van' },
  { id: 'personal', icon: <DirectionsCar />, title: 'Personal' },
];

const noop = () => undefined;

const VehicleThumb: React.FC<{ variant: 'truck' | 'trailer' }> = ({ variant }) => {
  const tokens =
    variant === 'trailer'
      ? { bg: 'rgba(254, 243, 199, 1)', color: 'rgba(120, 53, 15, 1)', icon: <RvHookup /> }
      : { bg: 'rgba(238, 242, 255, 1)', color: 'rgba(55, 48, 163, 1)', icon: <LocalShipping /> };
  return (
    <Box
      sx={{
        width: 44,
        height: 44,
        borderRadius: 1,
        bgcolor: tokens.bg,
        color: tokens.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '& svg': { fontSize: 22 },
      }}
    >
      {tokens.icon}
    </Box>
  );
};

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

const EmptyEquipmentState = () => (
  <PortalShell
    headerActions={<PortalNavActions onSaveExit={noop} />}
    stepper={<PortalStepper phases={STEPPER_AT_EQUIPMENT} />}
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
    <OnboardingCard
      phase="Equipment"
      title="Tell us about your vehicles."
      subtitle="Add each truck or trailer you operate — we use this to verify compliance and calculate rates. You can add more later."
      width="lg"
    >
      <ListBuilderEmptyState
        icon={<LocalShipping />}
        title="No vehicles yet"
        subtitle="Start with the truck you drive most. Add trailers and other vehicles after."
        ctaLabel="Add your first vehicle"
        onCtaClick={noop}
      />
    </OnboardingCard>
  </PortalShell>
);

const VehicleForm: React.FC<{
  formNumber: number;
  onCancel: () => void;
  onSave: () => void;
  onSaveAndAddAnother: () => void;
}> = ({ formNumber, onCancel, onSave, onSaveAndAddAnother }) => {
  const formik = useFormik({
    initialValues: {
      category: 'semi' as VehicleCategory,
      year: '',
      make: '',
      model: '',
      vin: '',
      licensePlate: '',
      gvwr: '80,000',
    } as Record<string, unknown>,
    onSubmit: noop,
  });

  const gvwrNumber = Number(String(formik.values.gvwr).replace(/[^\d]/g, '')) || 0;
  const showDotCallout = gvwrNumber > 26001;

  return (
    <ListBuilderInlineForm
      number={formNumber}
      title="Add a vehicle"
      onCancel={onCancel}
      onSave={onSave}
      onSaveAndAddAnother={onSaveAndAddAnother}
      saveLabel="Save vehicle"
      saveAndAddAnotherLabel="Save vehicle & add another"
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 1.5,
        }}
      >
        <Box sx={{ gridColumn: '1 / -1' }}>
          <FieldGroupLabel>Vehicle category</FieldGroupLabel>
        </Box>
        <Box sx={{ gridColumn: '1 / -1' }}>
          <SelectionCardGrid<VehicleCategory>
            options={CATEGORY_OPTIONS}
            value={formik.values.category as VehicleCategory}
            onChange={(id) => void formik.setFieldValue('category', id)}
            columns={4}
            size="sm"
            showRadio={false}
          />
        </Box>

        <Box sx={{ gridColumn: '1 / -1' }}>
          <FieldGroupLabel>Vehicle details</FieldGroupLabel>
        </Box>

        <TextField
          name="year"
          label="Year"
          placeholder="2019"
          required
          type="text"
          formik={formik}
        />
        <TextField
          name="make"
          label="Make"
          placeholder="Kenworth"
          required
          formik={formik}
        />
        <Box sx={{ gridColumn: '1 / -1' }}>
          <TextField
            name="model"
            label="Model"
            placeholder="T680"
            required
            formik={formik}
          />
        </Box>
        <Box sx={{ gridColumn: '1 / -1' }}>
          <TextField
            name="vin"
            label="VIN"
            placeholder="1XKAD49X8KJ100973"
            required
            formik={formik}
          />
        </Box>
        <TextField
          name="licensePlate"
          label="License plate"
          placeholder="NC-TR4892"
          required
          formik={formik}
        />
        <TextField
          name="gvwr"
          label="GVWR"
          placeholder="80,000"
          endAdornment="lbs"
          required
          formik={formik}
        />
        {showDotCallout ? (
          <Box sx={{ gridColumn: '1 / -1' }}>
            <Callout variant="red">
              <strong>DOT number required.</strong> Vehicles over 26,001 lbs GVWR must operate
              under a USDOT number. If you crossed state lines, you also need MC authority.
              We&apos;ll check this against what you entered in Company.
            </Callout>
          </Box>
        ) : null}
      </Box>
    </ListBuilderInlineForm>
  );
};

const FreightlinerItem = () => (
  <ListBuilderItem
    thumbnail={<VehicleThumb variant="truck" />}
    name="2022 Freightliner Cascadia"
    tags={[{ label: 'Semi-truck' }]}
    meta={['VIN 1FUJG…2148', 'NC-TR4892', '80,000 lbs GVWR']}
    onEdit={noop}
    onRemove={noop}
  />
);

const KenworthItem = () => (
  <ListBuilderItem
    thumbnail={<VehicleThumb variant="truck" />}
    name="2019 Kenworth T680"
    tags={[{ label: 'Semi-truck' }]}
    meta={['VIN 1XKAD…0973', 'NC-TR4893', '80,000 lbs GVWR']}
    onEdit={noop}
    onRemove={noop}
  />
);

const TrailerItem = () => (
  <ListBuilderItem
    thumbnail={<VehicleThumb variant="trailer" />}
    name="53' Dry Van"
    tags={[{ label: 'Trailer', variant: 'warn' }]}
    meta={['VIN 1JJV5…7290', 'NC-TL2210', '2021']}
    onEdit={noop}
    onRemove={noop}
  />
);

const AddingSecondVehicle: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <PortalShell
    headerActions={<PortalNavActions onSaveExit={noop} />}
    stepper={<PortalStepper phases={STEPPER_AT_EQUIPMENT} />}
    footer={
      <PortalFooterBar
        phaseLabel="Equipment"
        metaText="1 saved · adding vehicle 2"
        onBack={noop}
        onContinue={noop}
        continueDisabled
      />
    }
  >
    <OnboardingCard
      phase="Equipment"
      title="Tell us about your vehicles."
      subtitle="Add each truck or trailer you operate."
      width="lg"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <ListBuilderHeader count="1 vehicle" countMeta="1 truck" />
        <FreightlinerItem />
        <VehicleForm
          formNumber={2}
          onCancel={onClose}
          onSave={onClose}
          onSaveAndAddAnother={onClose}
        />
      </Box>
    </OnboardingCard>
  </PortalShell>
);

const StateB = () => {
  const [, setFormOpen] = useState(true);
  return <AddingSecondVehicle onClose={() => setFormOpen(false)} />;
};

const StateC = () => (
  <PortalShell
    headerActions={<PortalNavActions onSaveExit={noop} />}
    stepper={<PortalStepper phases={STEPPER_AT_EQUIPMENT} />}
    footer={
      <PortalFooterBar
        phaseLabel="Equipment"
        metaText="Step 2 of 6 · 3 vehicles saved"
        onBack={noop}
        onContinue={noop}
      />
    }
  >
    <OnboardingCard
      phase="Equipment"
      title="Tell us about your vehicles."
      subtitle="Add each truck or trailer you operate."
      width="lg"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <ListBuilderHeader
          count="3 vehicles"
          countMeta="2 trucks · 1 trailer"
          onSortClick={noop}
        />
        <FreightlinerItem />
        <KenworthItem />
        <TrailerItem />
        <ListBuilderAddMoreButton label="Add another vehicle" onClick={noop} />
      </Box>
    </OnboardingCard>
  </PortalShell>
);

const EquipmentEntryPreview: React.FC = () => {
  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto', p: { xs: 2, md: 4 }, bgcolor: 'grey.200' }}>
      <Box sx={{ mb: 4 }}>
        <KpiLabel>Carrier portal · Equipment phase</KpiLabel>
        <PageTitle sx={{ mb: 1 }}>equipment-entry</PageTitle>
        <BodyMuted sx={{ fontSize: 13 }}>
          Source: <code>docs/screenshots/mockups/onboarding/equipment-entry-and-drivers-list.html</code>.
          Uses the shared list-builder primitives (Empty / Item / InlineForm / AddMore).
        </BodyMuted>
      </Box>

      <StateFrame label="State A · empty">
        <EmptyEquipmentState />
      </StateFrame>

      <StateFrame label="State B · 1 vehicle saved · inline form open for vehicle 2 (GVWR > 26,001 triggers DOT callout)">
        <StateB />
      </StateFrame>

      <StateFrame label="State C · 3 vehicles saved · Continue enabled">
        <StateC />
      </StateFrame>
    </Box>
  );
};

export default EquipmentEntryPreview;
