import * as yup from 'yup';

const TRIGGERS = ['STATUS_CHANGE', 'CHECK_CALL', 'DOCUMENT_UPLOADED'] as const;
const CHANNELS = ['EMAIL', 'SMS'] as const;

export const customerIdParamSchema = yup.object({
  params: yup.object({
    customerId: yup.string().uuid().required(),
  }),
});

export const loadIdParamSchema = yup.object({
  params: yup.object({
    loadId: yup.string().uuid().required(),
  }),
});

export const trackingTokenParamSchema = yup.object({
  params: yup.object({
    token: yup.string().uuid().required(),
  }),
});

export const upsertSettingsSchema = yup.object({
  params: yup.object({
    customerId: yup.string().uuid().required(),
  }),
  body: yup.object({
    trigger: yup.string().oneOf([...TRIGGERS]).required(),
    channel: yup.string().oneOf([...CHANNELS]).required(),
    enabled: yup.boolean().required(),
    recipientEmail: yup.string().email().nullable(),
    recipientPhone: yup.string().nullable(),
  }),
});

export const bulkUpsertSettingsSchema = yup.object({
  params: yup.object({
    customerId: yup.string().uuid().required(),
  }),
  body: yup.object({
    settings: yup
      .array()
      .of(
        yup.object({
          trigger: yup.string().oneOf([...TRIGGERS]).required(),
          channel: yup.string().oneOf([...CHANNELS]).required(),
          enabled: yup.boolean().required(),
          recipientEmail: yup.string().email().nullable(),
          recipientPhone: yup.string().nullable(),
        }),
      )
      .required()
      .min(1),
  }),
});

const ccEmailsSchema = yup
  .array()
  .of(yup.string().email('ccEmails entries must be valid email addresses').required())
  .notRequired();

export const upsertOverrideSchema = yup.object({
  params: yup.object({
    loadId: yup.string().uuid().required(),
  }),
  body: yup.object({
    trigger: yup.string().oneOf([...TRIGGERS]).required(),
    channel: yup.string().oneOf([...CHANNELS]).required(),
    enabled: yup.boolean().required(),
    recipientEmail: yup.string().email().nullable(),
    recipientPhone: yup.string().nullable(),
    ccEmails: ccEmailsSchema,
  }),
});

export const bulkUpsertOverridesSchema = yup.object({
  params: yup.object({
    loadId: yup.string().uuid().required(),
  }),
  body: yup.object({
    overrides: yup
      .array()
      .of(
        yup.object({
          trigger: yup.string().oneOf([...TRIGGERS]).required(),
          channel: yup.string().oneOf([...CHANNELS]).required(),
          enabled: yup.boolean().required(),
          recipientEmail: yup.string().email().nullable(),
          recipientPhone: yup.string().nullable(),
          ccEmails: ccEmailsSchema,
        }),
      )
      .required()
      .min(1),
  }),
});

export const createTokenSchema = yup.object({
  params: yup.object({
    loadId: yup.string().uuid().required(),
  }),
});
