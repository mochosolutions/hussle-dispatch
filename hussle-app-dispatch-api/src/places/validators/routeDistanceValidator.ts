import * as Yup from 'yup';

const waypointSchema = Yup.object({
  lat: Yup.number().required('lat is required').min(-90).max(90),
  lng: Yup.number().required('lng is required').min(-180).max(180),
});

export const routeDistanceValidator = Yup.object({
  body: Yup.object({
    waypoints: Yup.array()
      .of(waypointSchema)
      .min(2, 'At least 2 waypoints are required')
      .required('waypoints is required'),
  }),
});
