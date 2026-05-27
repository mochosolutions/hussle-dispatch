import type { Request, Response } from 'express';
import type { Logger } from '@/shared/utils/logger';
import type { ShortLinkService } from '../services/shortLinkService';

export interface ResolveSlugControllerDeps {
  shortLinkService: ShortLinkService;
  logger: Logger;
}

export const createResolveSlugController =
  (deps: ResolveSlugControllerDeps) =>
  async (req: Request, res: Response): Promise<void> => {
    const slug = req.params['slug'] ?? '';
    const result = await deps.shortLinkService.resolveSlug(slug);

    if (result === null) {
      deps.logger.info('Short-link not found or expired', { slug });
      res.status(404).json({
        errors: [{ message: 'Link not found or expired' }],
      });
      return;
    }

    res.redirect(302, result.targetUrl);
  };
