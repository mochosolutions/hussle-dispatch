import * as Yup from 'yup';

export const sendManualPromptValidator = Yup.object({
  body: Yup.object({}).defined(),
  query: Yup.object({}).defined(),
  params: Yup.object({
    loadId: Yup.string()
      .uuid('loadId must be a valid uuid')
      .required('loadId is required'),
  }).defined(),
});

export const listPromptsForLoadValidator = Yup.object({
  body: Yup.object({}).defined(),
  query: Yup.object({
    page: Yup.number().integer().min(1).notRequired(),
    limit: Yup.number().integer().min(1).max(100).notRequired(),
  }).defined(),
  params: Yup.object({
    loadId: Yup.string()
      .uuid('loadId must be a valid uuid')
      .required('loadId is required'),
  }).defined(),
});
