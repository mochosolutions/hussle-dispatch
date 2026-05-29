import { CustomError } from '@mocho/common';

import type { RateconExtractionResult } from '@/ratecon-imports/types/rateconImportTypes';
import type { Logger } from '@/shared/utils/logger';

const DEFAULT_TIMEOUT_MS = 90_000;

export class PythonServiceError extends CustomError {
  statusCode = 502;
  readonly code = 'PYTHON_SERVICE_ERROR';

  constructor(public message: string) {
    super(message);
    Object.setPrototypeOf(this, PythonServiceError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}

export interface PythonServiceClient {
  extractRatecon(pdfBuffer: Buffer, fileName?: string): Promise<RateconExtractionResult>;
}

export interface PythonServiceClientConfig {
  baseUrl: string;
  internalToken: string;
  logger: Logger;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

interface ExtractResponse {
  result: RateconExtractionResult;
}

export const createPythonServiceClient = (
  config: PythonServiceClientConfig,
): PythonServiceClient => {
  const fetchFn = config.fetchImpl ?? fetch;
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return {
    extractRatecon: async (pdfBuffer, fileName = 'ratecon.pdf') => {
      const form = new FormData();
      form.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), fileName);

      let response: Response;
      try {
        response = await fetchFn(`${config.baseUrl}/ratecon/extract`, {
          method: 'POST',
          headers: { 'X-Internal-Token': config.internalToken },
          body: form,
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (error: unknown) {
        const reason = error instanceof Error ? error.message : String(error);
        config.logger.error('Python service request failed', { reason });
        throw new PythonServiceError(`Python service unreachable: ${reason}`);
      }

      if (!response.ok) {
        const body = await response.text();
        config.logger.error('Python service returned an error', {
          status: response.status,
          body: body.slice(0, 500),
        });
        throw new PythonServiceError(
          `Python service responded ${String(response.status)}: ${body.slice(0, 200)}`,
        );
      }

      const json = (await response.json()) as ExtractResponse;
      return json.result;
    },
  };
};
