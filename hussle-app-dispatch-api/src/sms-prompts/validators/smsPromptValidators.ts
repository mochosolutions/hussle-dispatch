import * as Yup from 'yup';

export const sendManualPromptValidator = Yup.object({
  body: Yup.object({
    body: Yup.string()
      .trim()
      .min(1, 'body must not be empty')
      .max(640, 'body must be 640 characters or fewer')
      .notRequired(),
  }).defined(),
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
