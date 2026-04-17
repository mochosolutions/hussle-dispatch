/**
 * Computes a commodity summary from a collection of stops.
 *
 * - commodity: deduplicated list from PICKUP stops, joined with ", "
 * - weight / pieceCount: summed from PICKUP stops
 * - isHazmat / isTarp: true if ANY stop (not just pickups) has the flag set
 */

export interface CommoditySummaryStop {
  type: string;
  commodity?: string | null;
  weight?: number | null;
  pieceCount?: number | null;
  isHazmat?: boolean | null;
  isTarp?: boolean | null;
}

export interface CommoditySummary {
  commodity: string | null;
  weight: number | null;
  pieceCount: number | null;
  isHazmat: boolean;
  isTarp: boolean;
}

export const computeCommoditySummary = (stops: CommoditySummaryStop[]): CommoditySummary => {
  const pickupStops = stops.filter((stop) => stop.type === 'PICKUP');

  if (pickupStops.length === 0) {
    return {
      commodity: null,
      weight: null,
      pieceCount: null,
      isHazmat: false,
      isTarp: false,
    };
  }

  const commodities = pickupStops
    .map((stop) => stop.commodity)
    .filter((c): c is string => c !== undefined && c !== null && c.length > 0);

  const uniqueCommodities = [...new Set(commodities)];

  const totalWeight = pickupStops.reduce((sum, stop) => {
    if (stop.weight !== undefined && stop.weight !== null) {
      return sum + stop.weight;
    }
    return sum;
  }, 0);

  const totalPieceCount = pickupStops.reduce((sum, stop) => {
    if (stop.pieceCount !== undefined && stop.pieceCount !== null) {
      return sum + stop.pieceCount;
    }
    return sum;
  }, 0);

  const hasWeight = pickupStops.some((stop) => stop.weight !== undefined && stop.weight !== null);
  const hasPieceCount = pickupStops.some(
    (stop) => stop.pieceCount !== undefined && stop.pieceCount !== null,
  );

  return {
    commodity: uniqueCommodities.length > 0 ? uniqueCommodities.join(', ') : null,
    weight: hasWeight ? totalWeight : null,
    pieceCount: hasPieceCount ? totalPieceCount : null,
    isHazmat: stops.some((stop) => stop.isHazmat === true),
    isTarp: stops.some((stop) => stop.isTarp === true),
  };
};
