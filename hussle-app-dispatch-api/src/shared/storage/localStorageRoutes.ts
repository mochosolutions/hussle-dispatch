import type { Request, Response, Router } from 'express';
import type { StorageProvider } from './storageProvider';

/**
 * Mounts local file-serving and upload routes for dev environments.
 *
 * GET  /api/v1/storage/:key(*) -> streams the file from local storage.
 * PUT  /api/v1/storage/:key(*) -> writes the request body to local storage.
 *
 * The key uses a wildcard param so nested paths (e.g. org/loads/doc.pdf) work.
 */
export const mountLocalStorageRoutes = (
  router: Router,
  storageProvider: StorageProvider,
): Router => {
  router.put('/api/v1/storage/*', async (req: Request, res: Response) => {
    const key = req.params[0];

    if (!key) {
      res.status(400).json({ errors: [{ message: 'Storage key is required' }] });
      return;
    }

    const contentType = req.headers['content-type'] ?? 'application/octet-stream';

    await storageProvider.put(key, req, contentType);

    res.status(200).json({ message: 'Upload successful' });
  });

  router.get('/api/v1/storage/*', async (req: Request, res: Response) => {
    // Express puts the wildcard portion (everything after /api/v1/storage/) in params[0]
    const key = req.params[0];

    if (!key) {
      res.status(400).json({ errors: [{ message: 'Storage key is required' }] });
      return;
    }

    const result = await storageProvider.get(key);

    res.setHeader('Content-Type', result.contentType);
    result.body.pipe(res);
  });

  return router;
};
