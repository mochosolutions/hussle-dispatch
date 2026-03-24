import * as yup from 'yup';

export const sendDriverLinkSchema = yup.object({
  params: yup.object({
    loadId: yup.string().uuid().required(),
  }),
});

export const advanceStatusSchema = yup.object({
  body: yup.object({
    status: yup
      .string()
      .oneOf(['EN_ROUTE_PICKUP', 'AT_PICKUP', 'IN_TRANSIT', 'AT_DELIVERY', 'DELIVERED'])
      .required(),
  }),
});

export const checkInSchema = yup.object({
  body: yup.object({
    location: yup.string().trim().max(500).optional(),
    latitude: yup.number().min(-90).max(90).optional(),
    longitude: yup.number().min(-180).max(180).optional(),
    status: yup.string().trim().max(100).optional(),
    eta: yup.string().optional(),
    notes: yup.string().trim().max(2000).optional(),
  }),
});

export const presignDocumentSchema = yup.object({
  body: yup.object({
    fileName: yup.string().required().trim().max(255),
    mimeType: yup
      .string()
      .required()
      .oneOf(['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']),
    type: yup.string().required().oneOf(['BOL_SIGNED', 'POD']),
  }),
});

export const confirmDocumentSchema = yup.object({
  params: yup.object({
    id: yup.string().uuid().required(),
  }),
});
