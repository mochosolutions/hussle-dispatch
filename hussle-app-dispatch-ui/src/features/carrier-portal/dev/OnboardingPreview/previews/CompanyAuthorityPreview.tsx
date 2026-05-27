import { useFormik } from 'formik';
import { Box } from '@mui/material';

import {
  AddressField,
  EINField,
  EmailField,
  PhoneField,
  SelectField,
  TextField,
} from '@mocho/ui/components';

import { BodyMuted, KpiLabel, PageTitle } from 'components/Typography';

import PortalShell from '../../../components/PortalShell';
import PortalNavActions from '../../../components/PortalNavActions';
import PortalStepper, {
  type PortalStepperPhase,
} from '../../../components/PortalStepper';
import PortalFooterBar from '../../../components/PortalFooterBar';
import OnboardingCard from '../../../components/OnboardingCard';
import ToggleCardGrid from '../../../components/ToggleCardGrid';
import RevealSection from '../../../components/RevealSection';
import Callout from '../../../components/Callout';
import FieldLabel from '../../../components/FieldLabel';
import FieldHint from '../../../components/FieldHint';
import FieldGroupLabel from '../../../components/FieldGroupLabel';
import FieldDivider from '../../../components/FieldDivider';
import ValidatePill from '../../../components/ValidatePill';

type McAuthority = 'yes' | 'no';
type HasDba = 'yes' | 'no';

interface CompanyValues {
  mcAuthority: '' | McAuthority;
  mcNumber: string;
  legalName: string;
  hasDba: '' | HasDba;
  dbaName: string;
  taxClassification: string;
  tinType: '' | 'EIN' | 'SSN';
  tin: string;
  dotNumber: string;
  companyPhone: string;
  companyEmail: string;
  businessAddress: string;
}

const EMPTY_VALUES: CompanyValues = {
  mcAuthority: '',
  mcNumber: '',
  legalName: '',
  hasDba: '',
  dbaName: '',
  taxClassification: '',
  tinType: '',
  tin: '',
  dotNumber: '',
  companyPhone: '',
  companyEmail: '',
  businessAddress: '',
};

const PHASE_LABELS = ['Company', 'Equipment', 'Drivers', 'Costs', 'Preferences', 'Documents'];

const phases = (states: PortalStepperPhase['state'][]): PortalStepperPhase[] =>
  PHASE_LABELS.map((label, index) => ({
    id: label.toLowerCase(),
    label,
    state: states[index] ?? 'pending',
  }));

const ACTIVE_STEPPER = phases(['active', 'pending', 'pending', 'pending', 'pending', 'pending']);

const TAX_CLASSIFICATION_OPTIONS = [
  { value: 'sole', label: 'Individual / Sole Proprietor' },
  { value: 'single_llc', label: 'Single-member LLC (disregarded entity)' },
  { value: 'llc_c', label: 'LLC — taxed as C-Corporation' },
  { value: 'llc_s', label: 'LLC — taxed as S-Corporation' },
  { value: 'llc_p', label: 'LLC — taxed as Partnership' },
  { value: 'c_corp', label: 'C-Corporation' },
  { value: 's_corp', label: 'S-Corporation' },
  { value: 'partner', label: 'Partnership' },
  { value: 'trust', label: 'Trust / Estate' },
];

const TIN_TYPE_OPTIONS = [
  { value: 'EIN', label: 'EIN — Employer Identification Number' },
  { value: 'SSN', label: 'SSN — Social Security Number' },
];

const MC_TOGGLE_OPTIONS = [
  { id: 'yes' as const, label: 'Yes, I have MC', subline: 'Authority issued by FMCSA' },
  { id: 'no' as const, label: "No, I don't", subline: 'Intrastate / box truck / not yet' },
];

const noop = () => undefined;

const useStaticFormik = (initialValues: CompanyValues) =>
  useFormik({
    initialValues: initialValues as unknown as Record<string, unknown>,
    onSubmit: noop,
  });

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

// State A — nothing selected
const StateA = () => (
  <PortalShell
    headerActions={<PortalNavActions onSaveExit={noop} />}
    stepper={<PortalStepper phases={ACTIVE_STEPPER} />}
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
    <OnboardingCard
      phase="Company"
      title="Do you have MC authority?"
      subtitle="MC authority is required for interstate for-hire trucking. Most owner-operators have it. Box truck and intrastate carriers often don't."
      width="lg"
    >
      <ToggleCardGrid options={MC_TOGGLE_OPTIONS} value={null} onChange={noop} />
    </OnboardingCard>
  </PortalShell>
);

// State B — Yes selected, MC# empty
const StateB = () => {
  const formik = useStaticFormik({ ...EMPTY_VALUES, mcAuthority: 'yes' });
  return (
    <PortalShell
      headerActions={<PortalNavActions onSaveExit={noop} />}
      stepper={<PortalStepper phases={ACTIVE_STEPPER} />}
      footer={
        <PortalFooterBar
          phaseLabel="Company"
          metaText="1 of 2 answered · MC# required"
          onBack={noop}
          onContinue={noop}
          continueLabel="Look up my authority"
          continueDisabled
        />
      }
    >
      <OnboardingCard
        phase="Company"
        title="Do you have MC authority?"
        subtitle="MC authority is required for interstate for-hire trucking. Most owner-operators have it. Box truck and intrastate carriers often don't."
        width="lg"
      >
        <ToggleCardGrid options={MC_TOGGLE_OPTIONS} value="yes" onChange={noop} />

        <RevealSection label="MC number — required" badge="step 2 of 2">
          <Box sx={{ maxWidth: 320 }}>
            <TextField
              name="mcNumber"
              label="What's your MC number?"
              placeholder="1234567"
              required
              startAdornment="MC-"
              formik={formik}
            />
          </Box>
          <FieldHint>
            Find this on your MC certificate or any authority letter from FMCSA. Usually 6 or 7
            digits.
          </FieldHint>
        </RevealSection>
      </OnboardingCard>
    </PortalShell>
  );
};

// State C — Yes selected, MC# filled valid
const StateC = () => {
  const formik = useStaticFormik({
    ...EMPTY_VALUES,
    mcAuthority: 'yes',
    mcNumber: '1234567',
  });
  return (
    <PortalShell
      headerActions={<PortalNavActions onSaveExit={noop} />}
      stepper={<PortalStepper phases={ACTIVE_STEPPER} />}
      footer={
        <PortalFooterBar
          phaseLabel="Company"
          metaText="Step 1 of 6 · MC authority"
          onBack={noop}
          onContinue={noop}
          continueLabel="Look up my authority"
        />
      }
    >
      <OnboardingCard
        phase="Company"
        title="Do you have MC authority?"
        subtitle="MC authority is required for interstate for-hire trucking. Most owner-operators have it. Box truck and intrastate carriers often don't."
        width="lg"
      >
        <ToggleCardGrid options={MC_TOGGLE_OPTIONS} value="yes" onChange={noop} />

        <RevealSection label="MC number — required" badge="step 2 of 2">
          <Box sx={{ maxWidth: 320 }}>
            <TextField
              name="mcNumber"
              label="What's your MC number?"
              required
              startAdornment="MC-"
              formik={formik}
            />
          </Box>
          <ValidatePill>Valid format</ValidatePill>
          <FieldHint>
            Find this on your MC certificate or any authority letter from FMCSA.
          </FieldHint>
        </RevealSection>
      </OnboardingCard>
    </PortalShell>
  );
};

// State D — No selected, full business form revealed
const StateD = () => {
  const formik = useStaticFormik({
    ...EMPTY_VALUES,
    mcAuthority: 'no',
    hasDba: 'no',
  });

  return (
    <PortalShell
      headerActions={<PortalNavActions onSaveExit={noop} />}
      stepper={<PortalStepper phases={ACTIVE_STEPPER} />}
      footer={
        <PortalFooterBar
          phaseLabel="Company"
          metaText="Step 1 of 6 · manual entry"
          onBack={noop}
          onContinue={noop}
          continueDisabled
        />
      }
    >
      <OnboardingCard
        phase="Company"
        title="Do you have MC authority?"
        subtitle="MC authority is required for interstate for-hire trucking. Most owner-operators have it. Box truck and intrastate carriers often don't."
        width="lg"
      >
        <ToggleCardGrid options={MC_TOGGLE_OPTIONS} value="no" onChange={noop} />

        <Callout variant="amber">
          <strong>No problem</strong> — FMCSA lookup is skipped. Enter your business details below
          and we&apos;ll take it from there.
        </Callout>

        <RevealSection label="Business details — required" badge="manual entry">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
            }}
          >
            <FieldGroupLabel>Identity</FieldGroupLabel>

            <Box sx={{ gridColumn: '1 / -1' }}>
              <TextField
                name="legalName"
                label="Legal name"
                placeholder="As shown on your tax return"
                required
                formik={formik}
              />
              <FieldHint>
                Must match what the IRS has on file. For sole proprietors this is usually your
                personal name.
              </FieldHint>
            </Box>

            <Box sx={{ gridColumn: '1 / -1' }}>
              <FieldLabel>Do you operate under a different name (DBA)?</FieldLabel>
              <ToggleCardGrid
                size="sm"
                options={[
                  { id: 'yes', label: 'Yes' },
                  { id: 'no', label: 'No' },
                ]}
                value="no"
                onChange={noop}
              />
              <FieldHint>DBA name field appears here if you choose Yes.</FieldHint>
            </Box>

            <FieldDivider />
            <FieldGroupLabel>Tax info</FieldGroupLabel>

            <Box sx={{ gridColumn: '1 / -1' }}>
              <SelectField
                name="taxClassification"
                label="Federal tax classification"
                data={TAX_CLASSIFICATION_OPTIONS}
                placeholder="Choose your tax classification…"
                required
                formik={formik}
              />
              <FieldHint>How your business is taxed (line 3 on the W-9).</FieldHint>
            </Box>

            <SelectField
              name="tinType"
              label="Tax ID type"
              data={TIN_TYPE_OPTIONS}
              placeholder="Select…"
              required
              formik={formik}
            />

            <EINField name="tin" label="Tax ID number" required formik={formik} />

            <FieldDivider />
            <FieldGroupLabel>Authority · DOT only</FieldGroupLabel>

            <Box sx={{ gridColumn: '1 / -1' }}>
              <Box sx={{ maxWidth: 320 }}>
                <TextField
                  name="dotNumber"
                  label="DOT number (if you have one)"
                  placeholder="9876543"
                  startAdornment="DOT-"
                  formik={formik}
                />
              </Box>
              <FieldHint>
                Required by federal law if any vehicle is over 26,001 lbs GVWR or crosses state
                lines. Leave blank if intrastate-only.
              </FieldHint>
            </Box>

            <FieldDivider />
            <FieldGroupLabel>Contact</FieldGroupLabel>

            <PhoneField name="companyPhone" label="Company phone" required formik={formik} />
            <EmailField
              name="companyEmail"
              label="Company email"
              placeholder="dispatch@yourcompany.com"
              required
              formik={formik}
            />

            <Box sx={{ gridColumn: '1 / -1' }}>
              <AddressField<Record<string, unknown>>
                name="businessAddress"
                label="Business address"
                placeholder="Start typing your address…"
                required
                mode="address"
                formik={formik}
                getSelectionState={(values) => {
                  const display = typeof values.businessAddress === 'string'
                    ? values.businessAddress
                    : '';
                  return { display, hasSelection: Boolean(display) };
                }}
                onResolve={(result, f) => {
                  const formatted = [result.address, result.city, result.state, result.zip]
                    .filter(Boolean)
                    .join(', ');
                  void f.setFieldValue('businessAddress', formatted);
                }}
                onClear={(f) => {
                  void f.setFieldValue('businessAddress', '');
                }}
              />
            </Box>
          </Box>
        </RevealSection>
      </OnboardingCard>
    </PortalShell>
  );
};

// State E — Interactive
const StateE = () => {
  const formik = useStaticFormik(EMPTY_VALUES);

  const handleMcChange = (id: McAuthority) => {
    void formik.setFieldValue('mcAuthority', id);
  };

  const mc = (formik.values.mcAuthority as '' | McAuthority) ?? '';

  return (
    <PortalShell
      headerActions={<PortalNavActions onSaveExit={noop} />}
      stepper={<PortalStepper phases={ACTIVE_STEPPER} />}
      footer={
        <PortalFooterBar
          phaseLabel="Company"
          metaText={mc === '' ? 'Step 1 of 6 · MC authority' : `Choice: ${mc}`}
          onBack={noop}
          onContinue={noop}
          continueLabel={mc === 'yes' ? 'Look up my authority' : 'Continue'}
          continueDisabled={mc === ''}
        />
      }
    >
      <OnboardingCard
        phase="Company"
        title="Do you have MC authority?"
        subtitle="Click Yes or No to see the disclosure pattern."
        width="lg"
      >
        <ToggleCardGrid
          options={MC_TOGGLE_OPTIONS}
          value={mc === '' ? null : mc}
          onChange={handleMcChange}
        />

        {mc === 'yes' ? (
          <RevealSection label="MC number — required" badge="step 2 of 2">
            <Box sx={{ maxWidth: 320 }}>
              <TextField
                name="mcNumber"
                label="What's your MC number?"
                placeholder="1234567"
                required
                startAdornment="MC-"
                formik={formik}
              />
            </Box>
            <FieldHint>Usually 6 or 7 digits.</FieldHint>
          </RevealSection>
        ) : null}

        {mc === 'no' ? (
          <Callout variant="amber">
            <strong>No problem</strong> — FMCSA lookup is skipped. Business-details form would
            reveal below.
          </Callout>
        ) : null}
      </OnboardingCard>
    </PortalShell>
  );
};

const CompanyAuthorityPreview: React.FC = () => {
  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto', p: { xs: 2, md: 4 }, bgcolor: 'grey.200' }}>
      <Box sx={{ mb: 4 }}>
        <KpiLabel>Carrier portal · Company phase</KpiLabel>
        <PageTitle sx={{ mb: 1 }}>company-authority-question</PageTitle>
        <BodyMuted sx={{ fontSize: 13 }}>
          Source: <code>docs/screenshots/mockups/onboarding/company-authority-question.html</code>.
          Form inputs now use <code>@mocho/ui</code> Formik-coupled fields (TextField, SelectField,
          EINField, PhoneField, EmailField, AddressField).
        </BodyMuted>
      </Box>

      <StateFrame label="State A · default · nothing selected">
        <StateA />
      </StateFrame>

      <StateFrame label='State B · "Yes" selected · MC# field reveals (empty)'>
        <StateB />
      </StateFrame>

      <StateFrame label='State C · "Yes" + MC# "1234567" valid · CTA enabled'>
        <StateC />
      </StateFrame>

      <StateFrame label='State D · "No" selected · amber callout + full business form'>
        <StateD />
      </StateFrame>

      <StateFrame label="State E · interactive · click Yes / No / type in fields">
        <StateE />
      </StateFrame>
    </Box>
  );
};

export default CompanyAuthorityPreview;
