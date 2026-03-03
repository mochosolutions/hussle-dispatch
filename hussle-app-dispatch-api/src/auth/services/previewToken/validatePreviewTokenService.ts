import jwt from 'jsonwebtoken';
import type { PreviewTokenPayload } from './createPreviewTokenService';

export interface ValidatePreviewTokenResult {
  userId: string;
  organizationId: string;
}

export interface ValidatePreviewTokenDeps {
  jwtSecret: string;
}

const isPreviewTokenPayload = (decoded: unknown): decoded is PreviewTokenPayload => {
  if (typeof decoded !== 'object' || decoded === null) {
    return false;
  }
  const obj = decoded as Record<string, unknown>;
  return (
    obj.purpose === 'preview' &&
    typeof obj.userId === 'string' &&
    typeof obj.organizationId === 'string'
  );
};

export const validatePreviewTokenService = (
  token: string,
  deps: ValidatePreviewTokenDeps
): ValidatePreviewTokenResult | null => {
  try {
    const decoded = jwt.verify(token, deps.jwtSecret);

    if (!isPreviewTokenPayload(decoded)) {
      return null;
    }

    return {
      userId: decoded.userId,
      organizationId: decoded.organizationId,
    };
  } catch {
    return null;
  }
};
