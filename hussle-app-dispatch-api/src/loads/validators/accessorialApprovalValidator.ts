import * as Yup from 'yup';

export const updateApprovalSchema = Yup.object({
  params: Yup.object({
    id: Yup.string().uuid('id must be a valid uuid').required('id is required'),
  }),
  body: Yup.object({
    approvalStatus: Yup.string()
      .oneOf(['NONE', 'PENDING', 'APPROVED', 'DISPUTED'])
      .required('approvalStatus is required'),
    approvalSource: Yup.string().trim().notRequired(),
    approvalNotes: Yup.string().trim().notRequired(),
    documentId: Yup.string().uuid().notRequired(),
  }),
});
