declare const process: { env: { API_URL: string } };

const API_URL = process.env.API_URL;
const PING_PATH = '/api/v1/load-board/ping';

export interface VerifySuccess {
  organizationId: string;
  organizationName: string;
}

export interface VerifyFailure {
  error: string;
}

export type VerifyResult = VerifySuccess | VerifyFailure;

const isFailure = (result: VerifyResult): result is VerifyFailure => 'error' in result;

export const verifyApiKey = async (key: string): Promise<VerifyResult> => {
  try {
    const response = await fetch(`${API_URL}${PING_PATH}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${key}` },
    });

    if (response.status === 401) {
      return { error: 'Invalid API key' };
    }

    if (!response.ok) {
      return { error: `API returned ${response.status}` };
    }

    const body: { data?: { organizationId?: unknown; organizationName?: unknown } } =
      await response.json();
    const orgId = body.data?.organizationId;
    const orgName = body.data?.organizationName;

    if (typeof orgId !== 'string' || typeof orgName !== 'string') {
      return { error: 'Unexpected response shape from API' };
    }

    return { organizationId: orgId, organizationName: orgName };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Cannot reach API';
    return { error: message };
  }
};

export { isFailure };
