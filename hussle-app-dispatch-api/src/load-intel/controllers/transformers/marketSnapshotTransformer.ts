import type { MarketSnapshot } from '../../types/loadIntelTypes';

interface MarketSnapshotResponse {
  state: string;
  city: string;
  loadToTruckRatio: number;
  tier: string;
  tierPoints: number;
  storedAt: string;
}

export const marketSnapshotTransformer = (snapshot: MarketSnapshot): MarketSnapshotResponse => ({
  state: snapshot.state,
  city: snapshot.city,
  loadToTruckRatio: snapshot.loadToTruckRatio,
  tier: snapshot.tier,
  tierPoints: snapshot.tierPoints,
  storedAt: snapshot.storedAt,
});
