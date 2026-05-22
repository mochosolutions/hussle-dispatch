// ---------------------------------------------------------------------------
// buildYupFromQuestions — builds a Yup ObjectSchema from a list of engine
// `Question` definitions. The schema is visibility-aware: hidden questions
// (whose `visibility` predicate evaluates to false against the trial session)
// are marked `notRequired().nullable()` so they don't block submit.
//
// Used exclusively by InputStep. Lives next to the renderer because it is
// step-local logic, not engine logic. The engine is pure and carries Yup
// fragments as opaque `unknown` references — never depends on Yup itself.
// ---------------------------------------------------------------------------

import * as Yup from 'yup';

import type { Question, Session } from 'features/carrier-portal/engine';
import { evaluatePredicate } from 'features/carrier-portal/engine';
import { tinYupFragment } from 'features/carrier-portal/components/TinField';

export interface BuildYupFromQuestionsInput {
  questions: Question[];
  session: Session;
}

const baseFor = (q: Question, required: boolean): Yup.AnySchema => {
  switch (q.fieldType) {
    case 'email':
      return Yup.string().email('Invalid email');
    case 'number':
      return Yup.number().typeError('Must be a number');
    case 'tin':
      return tinYupFragment();
    case 'date':
      return Yup.string();
    case 'checkbox':
      return Yup.boolean();
    case 'select':
    case 'cards':
    case 'toggle':
      return Yup.string();
    case 'mc':
      return Yup.string()
        .matches(/^(MC-)?\d{3,8}$/i, 'Invalid MC number format')
        .nullable();
    case 'address':
      // Required addresses validate every required sub-field so an empty `{}`
      // (initial state) surfaces specific per-field errors. Optional addresses
      // accept any shape so they don't block submit.
      return required
        ? Yup.object({
            line1: Yup.string().trim().required('Street address is required'),
            line2: Yup.string().trim().notRequired().nullable(),
            city: Yup.string().trim().required('City is required'),
            state: Yup.string().trim().required('State is required'),
            zip: Yup.string().trim().required('ZIP is required'),
            country: Yup.string().trim().required('Country is required'),
          })
        : Yup.object().nullable();
    case 'text':
    default:
      return Yup.string();
  }
};

export const buildYupFromQuestions = ({
  questions,
  session,
}: BuildYupFromQuestionsInput): Yup.ObjectSchema<Record<string, unknown>> => {
  const shape: Record<string, Yup.AnySchema> = {};
  for (const q of questions) {
    const visible = !q.visibility || evaluatePredicate(q.visibility, session);
    const required = visible && !q.optional;
    let schema = baseFor(q, required);
    // `address` already wires required sub-fields itself; the wrapper
    // `.required(...)` on the object would add a redundant "address is
    // required" message that fights with the per-field messages.
    if (q.fieldType === 'address') {
      shape[q.id] = schema;
      continue;
    }
    schema = required
      ? schema.required(`${q.label} is required`)
      : schema.notRequired().nullable();
    shape[q.id] = schema;
  }
  return Yup.object(shape) as Yup.ObjectSchema<Record<string, unknown>>;
};
