import { useFormik } from 'formik';
import { Box } from '@mui/material';
import { PeopleAltOutlined } from '@mui/icons-material';

import { EmailField, PhoneField, SelectField, TextField } from '@mocho/ui/components';

import { BodyMuted, KpiLabel, PageTitle } from 'components/Typography';

import PortalShell from '../../../components/PortalShell';
import PortalNavActions from '../../../components/PortalNavActions';
import PortalStepper, {
  type PortalStepperPhase,
} from '../../../components/PortalStepper';
import PortalFooterBar from '../../../components/PortalFooterBar';
import OnboardingCard from '../../../components/OnboardingCard';
import ListBuilderHeader from '../../../components/ListBuilderHeader';
import ListBuilderEmptyState from '../../../components/ListBuilderEmptyState';
import ListBuilderItem from '../../../components/ListBuilderItem';
import ListBuilderAddMoreButton from '../../../components/ListBuilderAddMoreButton';
import ListBuilderInlineForm from '../../../components/ListBuilderInlineForm';
import FieldGroupLabel from '../../../components/FieldGroupLabel';

const PHASE_LABELS = ['Company', 'Equipment', 'Drivers', 'Costs', 'Preferences', 'Documents'];

const STEPPER_AT_DRIVERS: PortalStepperPhase[] = PHASE_LABELS.map((label, index) => {
  if (index < 2) return { id: label.toLowerCase(), label, state: 'done' };
  if (index === 2) return { id: label.toLowerCase(), label, state: 'active' };
  return { id: label.toLowerCase(), label, state: 'pending' };
});

const PAY_TYPE_OPTIONS = [
  { value: 'percentage', label: 'Percentage' },
  { value: 'per_mile', label: 'Per mile' },
  { value: 'flat_rate', label: 'Flat rate' },
];

const PAY_SUFFIX: Record<string, string> = {
  percentage: '% of gross',
  per_mile: '/mi',
  flat_rate: '$ per load',
};

const noop = () => undefined;

const DriverAvatar: React.FC<{ initials: string; color?: 'primary' | 'purple' }> = ({
  initials,
  color = 'primary',
}) => {
  const bgcolor = color === 'purple' ? 'rgba(124, 58, 237, 1)' : 'primary.dark';
  return (
    <Box
      sx={{
        width: 44,
        height: 44,
        borderRadius: 1,
        bgcolor,
        color: 'common.white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: '0.02em',
      }}
    >
      {initials}
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

const EmptyDriversState = () => (
  <PortalShell
    headerActions={<PortalNavActions onSaveExit={noop} />}
    stepper={<PortalStepper phases={STEPPER_AT_DRIVERS} />}
    footer={
      <PortalFooterBar
        phaseLabel="Drivers"
        metaText="Step 3 of 6 · at least 1 driver required"
        helperText="Add at least 1 driver to continue"
        onBack={noop}
        onContinue={noop}
        continueDisabled
      />
    }
  >
    <OnboardingCard
      phase="Drivers"
      title="Add each driver who'll run loads for you."
      subtitle="Drivers get their own login to receive dispatched loads, message you back, and submit BOLs."
      width="lg"
    >
      <ListBuilderEmptyState
        icon={<PeopleAltOutlined />}
        title="No drivers added"
        subtitle="Start with yourself if you drive, then add anyone else who runs your trucks."
        ctaLabel="Add your first driver"
        onCtaClick={noop}
      />
    </OnboardingCard>
  </PortalShell>
);

const DriverForm: React.FC<{
  formNumber: number;
  onCancel: () => void;
  onSave: () => void;
  onSaveAndAddAnother: () => void;
}> = ({ formNumber, onCancel, onSave, onSaveAndAddAnother }) => {
  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      payType: 'percentage',
      payRate: '',
    } as Record<string, unknown>,
    onSubmit: noop,
  });

  const payType = String(formik.values.payType ?? 'percentage');
  const suffix = PAY_SUFFIX[payType] ?? '';

  return (
    <ListBuilderInlineForm
      number={formNumber}
      title="Add a driver"
      onCancel={onCancel}
      onSave={onSave}
      onSaveAndAddAnother={onSaveAndAddAnother}
      saveLabel="Save driver"
      saveAndAddAnotherLabel="Save driver & add another"
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 1.5,
        }}
      >
        <Box sx={{ gridColumn: '1 / -1' }}>
          <FieldGroupLabel>Name &amp; contact</FieldGroupLabel>
        </Box>

        <TextField
          name="firstName"
          label="First name"
          placeholder="Isaiah"
          required
          formik={formik}
        />
        <TextField
          name="lastName"
          label="Last name"
          placeholder="Williams"
          required
          formik={formik}
        />
        <PhoneField name="phone" label="Phone" required formik={formik} />
        <EmailField
          name="email"
          label="Email"
          placeholder="isaiah@mochosolutions.com"
          required
          formik={formik}
        />

        <Box sx={{ gridColumn: '1 / -1' }}>
          <FieldGroupLabel>Pay structure</FieldGroupLabel>
        </Box>
        <SelectField
          name="payType"
          label="Pay type"
          data={PAY_TYPE_OPTIONS}
          required
          formik={formik}
        />
        <TextField
          name="payRate"
          label="Pay rate"
          placeholder="70"
          endAdornment={suffix}
          required
          formik={formik}
        />
      </Box>
    </ListBuilderInlineForm>
  );
};

const MarcusItem = () => (
  <ListBuilderItem
    thumbnail={<DriverAvatar initials="MW" />}
    name="Marcus Williams"
    tags={[{ label: 'Owner', variant: 'owner' }]}
    meta={['marcus@mochosolutions.com', '(704) 555-0142', 'Percentage · 75% gross']}
    onEdit={noop}
    onRemove={noop}
  />
);

const IsaiahItem = () => (
  <ListBuilderItem
    thumbnail={<DriverAvatar initials="IW" color="purple" />}
    name="Isaiah Williams"
    meta={['isaiah@mochosolutions.com', '(704) 555-0188', 'Per mile · $0.62/mi']}
    onEdit={noop}
    onRemove={noop}
  />
);

const StateB = () => (
  <PortalShell
    headerActions={<PortalNavActions onSaveExit={noop} />}
    stepper={<PortalStepper phases={STEPPER_AT_DRIVERS} />}
    footer={
      <PortalFooterBar
        phaseLabel="Drivers"
        metaText="1 saved · adding driver 2"
        onBack={noop}
        onContinue={noop}
        continueDisabled
      />
    }
  >
    <OnboardingCard
      phase="Drivers"
      title="Add each driver who'll run loads for you."
      subtitle="Drivers get their own login."
      width="lg"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <ListBuilderHeader count="1 driver" countMeta="1 owner-operator" />
        <MarcusItem />
        <DriverForm formNumber={2} onCancel={noop} onSave={noop} onSaveAndAddAnother={noop} />
      </Box>
    </OnboardingCard>
  </PortalShell>
);

const StateC = () => (
  <PortalShell
    headerActions={<PortalNavActions onSaveExit={noop} />}
    stepper={<PortalStepper phases={STEPPER_AT_DRIVERS} />}
    footer={
      <PortalFooterBar
        phaseLabel="Drivers"
        metaText="Step 3 of 6 · 2 drivers configured"
        onBack={noop}
        onContinue={noop}
      />
    }
  >
    <OnboardingCard
      phase="Drivers"
      title="Add each driver who'll run loads for you."
      subtitle="Drivers get their own login."
      width="lg"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <ListBuilderHeader
          count="2 drivers"
          countMeta="1 owner · 1 employee"
          onSortClick={noop}
        />
        <MarcusItem />
        <IsaiahItem />
        <ListBuilderAddMoreButton label="Add another driver" onClick={noop} />
      </Box>
    </OnboardingCard>
  </PortalShell>
);

const DriversListPreview: React.FC = () => {
  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto', p: { xs: 2, md: 4 }, bgcolor: 'grey.200' }}>
      <Box sx={{ mb: 4 }}>
        <KpiLabel>Carrier portal · Drivers phase</KpiLabel>
        <PageTitle sx={{ mb: 1 }}>drivers-list</PageTitle>
        <BodyMuted sx={{ fontSize: 13 }}>
          Source: <code>docs/screenshots/mockups/onboarding/equipment-entry-and-drivers-list.html</code>.
          Same list-builder vocabulary as Equipment — different data shape only. Renders only when{' '}
          <code>drivers.hasEmployeeDrivers === &apos;yes&apos;</code>; the owner-op confirm screen
          covers the No path (built later).
        </BodyMuted>
      </Box>

      <StateFrame label="State A · empty">
        <EmptyDriversState />
      </StateFrame>

      <StateFrame label="State B · 1 driver saved · inline form open for driver 2">
        <StateB />
      </StateFrame>

      <StateFrame label="State C · 2 drivers saved · Continue enabled">
        <StateC />
      </StateFrame>
    </Box>
  );
};

export default DriversListPreview;
