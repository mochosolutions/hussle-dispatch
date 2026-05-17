import * as Yup from 'yup';

const moneyOrZero = Yup.number().required().min(0);

const equipmentPaymentSchema = Yup.object({
  assetId: Yup.string().uuid('assetId must be a uuid').required('assetId is required'),
  ownership: Yup.string().oneOf(['owned', 'financed']).required('ownership is required'),
  monthlyAmount: moneyOrZero,
  insuranceMonthlyAmount: Yup.number().min(0).notRequired(),
});

const itemSchema = Yup.object({
  id: Yup.string().required(),
  name: Yup.string().max(255).required(),
  monthlyAmount: moneyOrZero,
});

export const costAnalysisValidator = Yup.object({
  body: Yup.object({
    equipmentPayments: Yup.array()
      .of(equipmentPaymentSchema)
      .required()
      .min(1, 'at least one equipment payment is required'),
    policies: Yup.array().of(itemSchema).required(),
    subscriptions: Yup.array().of(itemSchema).required(),
    overhead: Yup.object({
      officeUtilities: moneyOrZero,
      accountingLegal: moneyOrZero,
      bankFeesCardsFactoring: moneyOrZero,
    }).required(),
    ownerPay: Yup.object({
      perTruckWeekly: moneyOrZero,
      payBasis: Yup.string().oneOf(['gross', 'net']).required('payBasis is required'),
    }).required(),
    fuel: Yup.object({
      dieselPrice: Yup.number().required().min(0).max(20),
      mpg: Yup.number().required().min(1).max(30),
    }).required(),
    wearOps: Yup.object({
      maintenance: moneyOrZero,
      tires: moneyOrZero,
      def: moneyOrZero,
      tolls: moneyOrZero,
    }).required(),
    operating: Yup.object({
      loadedMilesPerMonth: Yup.number().required().min(0),
      deadheadPct: Yup.number().required().min(0).max(100),
      marginPct: Yup.number().required().min(0).max(100),
    }).required(),
  }),
});
