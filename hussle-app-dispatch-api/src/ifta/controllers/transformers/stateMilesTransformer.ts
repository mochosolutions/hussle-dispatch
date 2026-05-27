import type { LoadStateMiles } from '@prisma/client';

export interface StateMilesResponseItem {
  state: string;
  miles: string;
  source: string;
}

export const toStateMilesResponse = (entries: LoadStateMiles[]): StateMilesResponseItem[] =>
  entries.map((entry) => ({
    state: entry.state,
    miles: entry.miles.toString(),
    source: entry.source,
  }));
