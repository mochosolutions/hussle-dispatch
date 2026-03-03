import type { Request, Response } from 'express';
import { logger } from '@/shared/utils/logger';
import { getJwtSecret } from '../../constants';
import { createPreviewTokenService } from '../../services/previewToken/createPreviewTokenService';

export const createPreviewTokenController = (req: Request, res: Response) => {
  try {
    const { user } = req;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = createPreviewTokenService(
      {
        userId: user.userId,
        organizationId: user.organizationId,
      },
      { jwtSecret: getJwtSecret() }
    );

    return res.status(200).json({ token });
  } catch (error) {
    logger.error('[createPreviewTokenController] Error', { error });
    return res.status(500).json({ error: 'Failed to create preview token' });
  }
};
