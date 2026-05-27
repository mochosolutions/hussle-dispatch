import type { LoadIntelRedis } from '../../types/loadIntelTypes';
import type { LoadChain } from '../../types/backhaulTypes';
import { loadIntelTransformer } from './loadIntelTransformer';

export const toBackhaulResponse = (results: LoadIntelRedis[]) =>
  results.map(loadIntelTransformer);

interface ChainStepResponse {
  loadHash: string;
  origin: { city: string; state: string };
  dest: { city: string; state: string };
  rate?: number;
  loadedMiles?: number;
  compositeScore: number;
}

interface LoadChainResponse {
  steps: ChainStepResponse[];
  totalMiles: number;
  totalRate: number;
  chainScore: number;
}

export const toChainResponse = (chains: LoadChain[]): LoadChainResponse[] =>
  chains.map((chain) => ({
    steps: chain.steps.map((step) => ({
      loadHash: step.loadHash,
      origin: step.origin,
      dest: step.dest,
      rate: step.rate,
      loadedMiles: step.loadedMiles,
      compositeScore: step.compositeScore,
    })),
    totalMiles: chain.totalMiles,
    totalRate: chain.totalRate,
    chainScore: chain.chainScore,
  }));
