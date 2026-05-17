import * as Yup from 'yup';

export const saveAnswerValidator = Yup.object({
  body: Yup.object({
    questionId: Yup.string().required('questionId is required').max(100),
    value: Yup.mixed().required('value is required'),
    phase: Yup.number().integer().min(1).max(6).optional(),
  }),
});

export const submitStepValidator = Yup.object({
  body: Yup.object({
    stepId: Yup.string().required('stepId is required').max(100),
    answers: Yup.object().required('answers is required'),
  }),
});
