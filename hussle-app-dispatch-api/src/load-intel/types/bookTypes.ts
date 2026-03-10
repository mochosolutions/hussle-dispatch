import type { LoadIntelPayload } from './loadIntelTypes';

/**
 * Pre-fill data returned when booking a load from intel.
 * This data is used to populate a load creation form — it does NOT create a load.
 */
export interface BookLoadPrefill {
  loadHash: string;
  source: string;
  origin: { city: string; state: string };
  dest: { city: string; state: string };
  pickupDate: string;
  deliveryDate?: string;
  equipmentType: string;
  rate?: number;
  loadedMiles?: number;
  brokerName?: string;
  brokerMc?: string;
  brokerPhone?: string;
  weight?: number;
}

/**
 * Pre-fill data for a chain booking.
 */
export interface BookChainPrefill {
  outbound: BookLoadPrefill;
  backhaul: BookLoadPrefill[];
}

/**
 * Input for manual load intel entry.
 */
export interface ManualLoadIntelInput {
  origin: { city: string; state: string };
  dest: { city: string; state: string };
  pickupDate: string;
  equipmentType: string;
  rate?: number;
  miles?: number;
  broker?: string;
}
