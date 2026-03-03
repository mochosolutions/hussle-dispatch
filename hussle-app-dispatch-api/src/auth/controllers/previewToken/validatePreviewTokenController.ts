import type { Request, Response } from 'express';
import { logger } from '@/shared/utils/logger';
import { getJwtSecret } from '../../constants';
import { validatePreviewTokenService } from '../../services/previewToken/validatePreviewTokenService';

export const validatePreviewTokenController = (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ valid: false, error: 'Token is required' });
    }

    const result = validatePreviewTokenService(token, { jwtSecret: getJwtSecret() });

    if (!result) {
      return res.status(200).json({ valid: false });
    }

    return res.status(200).json({
      valid: true,
      user: {
        userId: result.userId,
        organizationId: result.organizationId,
      },
    });
  } catch (error) {
    logger.error('[validatePreviewTokenController] Error', { error });
    return res.status(500).json({ valid: false, error: 'Failed to validate preview token' });
  }
};
