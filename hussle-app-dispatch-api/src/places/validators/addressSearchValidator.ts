import * as Yup from 'yup';

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export const addressSearchValidator = Yup.object({
  query: Yup.object({
    query: Yup.string().trim().required('query is required').min(1),
    limit: Yup.number().integer().min(1).max(20).notRequired(),
    biasLat: Yup.number()
      .typeError('biasLat must be a number')
      .min(-90)
      .max(90)
      .nullable()
      .notRequired(),
    biasLng: Yup.number()
      .typeError('biasLng must be a number')
      .min(-180)
      .max(180)
      .nullable()
      .notRequired()
      .test(
        'bias-pair-both-or-neither',
        'biasLat and biasLng must be supplied together',
        function (value) {
          const { biasLat } = this.parent as { biasLat: unknown };
          const lngProvided = isFiniteNumber(value);
          const latProvided = isFiniteNumber(biasLat);
          return lngProvided === latProvided;
        },
      ),
  }),
});
