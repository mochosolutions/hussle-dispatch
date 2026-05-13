import { useMemo } from 'react';
import { Box, Stack } from '@mui/material';
import type { FormikErrors, FormikProps, FormikTouched } from 'formik';

import { MainCard } from 'mocho/components';
import {
  AddressField,
  CurrencyField,
  EmailField,
  MultiSelectChipField,
  NumericField,
  PercentField,
  PhoneField,
  SelectField,
  StateField,
  TextField,
  TypeaheadField,
  ZipCodeField,
  EINField,
} from 'mocho/components/form-fields';
import type {
  QuestionDefinition,
  SubQuestionDefinition,
} from 'components/ConversationalForm';
import { InputRenderer } from 'components/ConversationalForm';
import type { AddressSearchResult } from 'features/place/types';

import { DocumentSigningFlow } from '../DocumentSigningFlow';
import { DocumentUploadZone } from '../DocumentUploadZone';
import YesNoField from '../YesNoField';
import EquipmentPhaseSection from '../EquipmentPhaseSection';
import DriversPhaseSection from '../DriversPhaseSection';

type AnyQuestion = QuestionDefinition | SubQuestionDefinition;

interface PhaseFormFormik {
  values: Record<string, unknown>;
  errors: FormikErrors<Record<string, unknown>>;
  touched: FormikTouched<Record<string, unknown>>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  setFieldValue: (field: string, value: unknown) => void;
}

interface PhaseFormProps {
  questions: QuestionDefinition[];
  phaseLabel: string;
  formik: PhaseFormFormik;
  token: string;
}

const isVisible = (q: AnyQuestion, values: Record<string, unknown>): boolean =>
  !q.condition || q.condition(values);

const looksLikeEmail = (id: string) => /email/i.test(id);
const looksLikePhone = (id: string) => /phone/i.test(id);
const looksLikeZip = (id: string) => /(\.zip|zipcode)/i.test(id);
const looksLikeEin = (id: string) => /\.ein$/i.test(id);
const looksLikeState = (id: string) => /\.state$/i.test(id);
const looksLikeRate = (id: string) => /rate|fee|percent/i.test(id);

interface FieldProps {
  question: AnyQuestion;
  formik: PhaseFormFormik;
  token: string;
}

const QuestionField: React.FC<FieldProps> = ({ question, formik, token }) => {
  const { id, label, hint, inputType, required, options, startAdornment, endAdornment } = question;
  const common = {
    name: id,
    label,
    required: Boolean(required),
    formik,
  };

  const withHint = (node: React.ReactNode): React.ReactNode =>
    hint ? (
      <Box>
        {node}
        <Box sx={{ mt: 0.5, color: 'text.secondary', fontSize: 13 }}>{hint}</Box>
      </Box>
    ) : (
      node
    );

  switch (inputType) {
    case 'address': {
      const prefix = id.replace(/\.address$/, '');
      const keys = {
        address: id,
        city: `${prefix}.city`,
        state: `${prefix}.state`,
        zip: `${prefix}.zip`,
        lat: `${prefix}.lat`,
        lng: `${prefix}.lng`,
      };
      const addressFormik = formik as unknown as FormikProps<Record<string, unknown>>;
      return withHint(
        <AddressField
          name={id}
          label={label}
          required={Boolean(required)}
          formik={addressFormik}
          mode="address"
          placeholder="Search for your business address"
          getSelectionState={(values) => {
            const street = (values[keys.address] as string | undefined) ?? '';
            const city = (values[keys.city] as string | undefined) ?? '';
            const state = (values[keys.state] as string | undefined) ?? '';
            const zip = (values[keys.zip] as string | undefined) ?? '';
            const lat = values[keys.lat];
            const lng = values[keys.lng];
            const tail = [city, state].filter(Boolean).join(', ');
            const display = [street, tail].filter(Boolean).join(', ') + (zip ? ` ${zip}` : '');
            return {
              display,
              hasSelection: typeof lat === 'number' && typeof lng === 'number',
            };
          }}
          onResolve={(result: AddressSearchResult, fk) => {
            void fk.setFieldValue(keys.address, result.address);
            void fk.setFieldValue(keys.city, result.city);
            void fk.setFieldValue(keys.state, result.state);
            void fk.setFieldValue(keys.zip, result.zip);
            void fk.setFieldValue(keys.lat, result.lat);
            void fk.setFieldValue(keys.lng, result.lng);
          }}
          onClear={(fk) => {
            void fk.setFieldValue(keys.address, '');
            void fk.setFieldValue(keys.city, '');
            void fk.setFieldValue(keys.state, '');
            void fk.setFieldValue(keys.zip, '');
            void fk.setFieldValue(keys.lat, null);
            void fk.setFieldValue(keys.lng, null);
          }}
        />,
      );
    }
    case 'yesNo':
      return withHint(
        <YesNoField
          {...common}
          yesLabel={'yesLabel' in question ? question.yesLabel : undefined}
          noLabel={'noLabel' in question ? question.noLabel : undefined}
        />,
      );
    case 'currency':
      return withHint(<CurrencyField {...common} suffix={endAdornment} />);
    case 'number':
      if (looksLikeRate(id)) {
        return withHint(<PercentField {...common} />);
      }
      return withHint(<NumericField {...common} suffix={endAdornment} />);
    case 'select':
      return withHint(<SelectField {...common} data={options ?? []} />);
    case 'multiSelect':
      return withHint(<MultiSelectChipField {...common} options={options ?? []} />);
    case 'tagInput':
      return (
        <TypeaheadField
          {...common}
          helperText={hint}
          options={[]}
          multiple
          freeSolo
        />
      );
    case 'vehicleList':
      return (
        <Box>
          {hint ? (
            <Box sx={{ mb: 2, color: 'text.secondary', fontSize: 13 }}>{hint}</Box>
          ) : null}
          <EquipmentPhaseSection fieldName={id} formik={formik} />
        </Box>
      );
    case 'driverList':
      return (
        <Box>
          {hint ? (
            <Box sx={{ mb: 2, color: 'text.secondary', fontSize: 13 }}>{hint}</Box>
          ) : null}
          <DriversPhaseSection fieldName={id} formik={formik} />
        </Box>
      );
    case 'documentSign':
      return (
        <Box>
          {hint ? (
            <Box sx={{ mb: 1.5, color: 'text.secondary', fontSize: 13 }}>{hint}</Box>
          ) : null}
          <DocumentSigningFlow
            token={token}
            onComplete={() => formik.setFieldValue(id, true)}
          />
        </Box>
      );
    case 'documentUpload':
      return (
        <Box>
          {hint ? (
            <Box sx={{ mb: 1.5, color: 'text.secondary', fontSize: 13 }}>{hint}</Box>
          ) : null}
          <DocumentUploadZone
            token={token}
            documentType={question.documentType ?? ''}
            label={label}
            onUploadComplete={(documentId) => formik.setFieldValue(id, documentId)}
          />
        </Box>
      );
    case 'slider':
    case 'stateGrid':
    case 'presetTiles':
      return (
        <Box>
          <Box sx={{ mb: 1, fontWeight: 600, fontSize: 14 }}>
            {label}
            {required ? (
              <Box component="span" sx={{ color: 'error.main', ml: 0.5 }}>
                *
              </Box>
            ) : null}
          </Box>
          {hint ? (
            <Box sx={{ mb: 1, color: 'text.secondary', fontSize: 13 }}>{hint}</Box>
          ) : null}
          <InputRenderer
            inputType={inputType}
            value={formik.values[id]}
            onChange={(value) => formik.setFieldValue(id, value)}
            options={options}
            required={required}
          />
        </Box>
      );
    case 'text':
    default:
      if (looksLikeEmail(id)) {
        return withHint(<EmailField {...common} />);
      }
      if (looksLikePhone(id)) {
        return withHint(<PhoneField {...common} />);
      }
      if (looksLikeEin(id)) {
        return withHint(<EINField {...common} />);
      }
      if (looksLikeZip(id)) {
        return withHint(<ZipCodeField {...common} />);
      }
      if (looksLikeState(id)) {
        return withHint(<StateField {...common} />);
      }
      return withHint(
        <TextField {...common} startAdornment={startAdornment} endAdornment={endAdornment} />,
      );
  }
};

const PhaseForm: React.FC<PhaseFormProps> = ({ questions, phaseLabel, formik, token }) => {
  const grouped = useMemo(() => {
    const result: { kind: 'single' | 'group'; items: QuestionDefinition[] }[] = [];
    let buffer: QuestionDefinition[] = [];
    let bufferCondition: QuestionDefinition['condition'] | null = null;

    const flush = () => {
      if (buffer.length === 0) {
        return;
      }
      result.push({ kind: buffer.length === 1 ? 'single' : 'group', items: buffer });
      buffer = [];
      bufferCondition = null;
    };

    questions
      .filter((q) => isVisible(q, formik.values))
      .forEach((q) => {
        if (!q.condition) {
          flush();
          result.push({ kind: 'single', items: [q] });
          return;
        }
        if (bufferCondition === q.condition) {
          buffer.push(q);
        } else {
          flush();
          buffer = [q];
          bufferCondition = q.condition;
        }
      });
    flush();
    return result;
  }, [questions, formik.values]);

  return (
    <MainCard title={phaseLabel.toUpperCase()} sx={{ borderRadius: 2 }}>
      <Stack spacing={3}>
        {grouped.map((row, idx) => {
          if (row.kind === 'single') {
            const q = row.items[0];
            return (
              <Box key={q.id}>
                <QuestionField question={q} formik={formik} token={token} />
                {(q.subQuestions ?? [])
                  .filter((sub) => isVisible(sub, formik.values))
                  .map((sub) => (
                    <Box
                      key={sub.id}
                      sx={{
                        mt: 2,
                        ml: { xs: 1, sm: 2 },
                        pl: { xs: 1.5, sm: 2.5 },
                        borderLeft: 2,
                        borderColor: 'primary.light',
                      }}
                    >
                      <QuestionField question={sub} formik={formik} token={token} />
                    </Box>
                  ))}
              </Box>
            );
          }
          return (
            <Box
              key={`group-${idx}-${row.items[0].id}`}
              sx={{
                pl: { xs: 1.5, sm: 2.5 },
                borderLeft: 3,
                borderColor: 'primary.main',
              }}
            >
              <Stack spacing={3}>
                {row.items.map((q) => (
                  <QuestionField key={q.id} question={q} formik={formik} token={token} />
                ))}
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </MainCard>
  );
};

export default PhaseForm;
