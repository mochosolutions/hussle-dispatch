import type { StatusTransitionResponse } from '../../types/loadStatusTypes';
import { toLoadDetailResponse } from './loadTransformer';
import type { LoadDetailResponse } from './loadTransformer';

export interface StatusTransitionApiResponse {
  success: boolean;
  load?: LoadDetailResponse;
  warnings?: { code: string; message: string; detail?: string }[];
  error?: { code: string; message: string };
}

export const toStatusTransitionResponse = (
  result: StatusTransitionResponse,
): StatusTransitionApiResponse => {
  const response: StatusTransitionApiResponse = {
    success: result.success,
  };

  if (result.load !== undefined) {
    response.load = toLoadDetailResponse(result.load);
  }

  if (result.warnings !== undefined && result.warnings.length > 0) {
    response.warnings = result.warnings;
  }

  if (result.error !== undefined) {
    response.error = result.error;
  }

  return response;
};
