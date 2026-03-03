import jwt from 'jsonwebtoken';

export interface PreviewTokenPayload {
  userId: string;
  organizationId: string;
  purpose: 'preview';
}

export interface CreatePreviewTokenInput {
  userId: string;
  organizationId: string;
}

export interface CreatePreviewTokenDeps {
  jwtSecret: string;
}

const PREVIEW_TOKEN_EXPIRY = '5m';

export const createPreviewTokenService = (
  input: CreatePreviewTokenInput,
  deps: CreatePreviewTokenDeps
): string => {
  const payload: PreviewTokenPayload = {
    userId: input.userId,
    organizationId: input.organizationId,
    purpose: 'preview',
  };

  return jwt.sign(payload, deps.jwtSecret, { expiresIn: PREVIEW_TOKEN_EXPIRY });
};
