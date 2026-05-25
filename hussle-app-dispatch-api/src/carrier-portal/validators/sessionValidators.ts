import * as Yup from 'yup';

export const submitStepValidator = Yup.object({
  body: Yup.object({
    stepId: Yup.string().required('stepId is required').max(100),
    answers: Yup.mixed()
      .required('answers is required')
      .test('is-object', 'answers must be an object', (value) =>
        typeof value === 'object' && value !== null && !Array.isArray(value),
      ),
  }),
});
