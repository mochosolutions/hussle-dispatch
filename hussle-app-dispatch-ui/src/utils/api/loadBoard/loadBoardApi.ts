import axios from 'utils/axios';
import type { LoadBoardFeedResponse } from 'features/load/types';

export const getLoadBoardFeed = async (source?: string): Promise<LoadBoardFeedResponse> => {
  const params = source ? { source } : {};
  const response = await axios.get<LoadBoardFeedResponse>('/load-board/feed', { params });
  return response.data;
};

export const ingestLoads = async (
  source: string,
  loads: Record<string, unknown>[],
): Promise<{ data: { count: number } }> => {
  const response = await axios.post('/load-board/ingest', { source, loads });
  return response.data;
};
