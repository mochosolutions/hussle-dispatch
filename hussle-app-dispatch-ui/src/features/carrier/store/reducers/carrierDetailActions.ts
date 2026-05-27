import { createAction } from '@reduxjs/toolkit';

export const fetchCarrierDriversRequest = createAction<{ carrierId: string }>(
  'carrierDetail/fetchCarrierDriversRequest',
);

export const fetchCarrierVehiclesRequest = createAction<{ carrierId: string }>(
  'carrierDetail/fetchCarrierVehiclesRequest',
);
