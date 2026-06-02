import type { NextFunction, Request, Response, Router } from 'express';
import { appAuth } from '../middleware/authenticateUser';
import { verifyStorageSignature } from './localStorageSigning';
import type { StorageProvider } from './storageProvider';

/**
 * Allow the request when it carries a valid presigned-URL signature (so
 * unauthenticated portal clients can upload/download directly, mirroring S3).
 * Otherwise fall back to requiring an app session — preserving access for
 * direct, authenticated calls.
 */
const storageAuth =
  (signingSecret: string) => (req: Request, res: Response, next: NextFunction) => {
    const key = req.params[0];
    const sig = typeof req.query['sig'] === 'string' ? req.query['sig'] : undefined;
    const exp = typeof req.query['exp'] === 'string' ? req.query['exp'] : undefined;

    if (key !== undefined && verifyStorageSignature(signingSecret, key, { exp, sig })) {
      next();
      return;
    }

    appAuth(req, res, next);
  };

/**
 * Mounts local file-serving and upload routes for dev environments.
 *
 * GET  /api/v1/storage/:key(*) -> streams the file from local storage.
 * PUT  /api/v1/storage/:key(*) -> writes the request body to local storage.
 *
 * Both routes require a valid app session — without auth, every stored file
 * (invoices, documents, agreements, expenses) would be readable by anyone who
 * can reach the API and guess a key. The auth gate is defense-in-depth only;
 * proper per-entity scope checks happen on each domain's download endpoint.
 *
 * The key uses a wildcard param so nested paths (e.g. org/loads/doc.pdf) work.
 */
export const mountLocalStorageRoutes = (
  router: Router,
  storageProvider: StorageProvider,
  signingSecret: string,
): Router => {
  router.put('/api/v1/storage/*', storageAuth(signingSecret), async (req: Request, res: Response) => {
    const key = req.params[0];

    if (!key) {
      res.status(400).json({ errors: [{ message: 'Storage key is required' }] });
      return;
    }

    const contentType = req.headers['content-type'] ?? 'application/octet-stream';

    await storageProvider.put(key, req, contentType);

    res.status(200).json({ message: 'Upload successful' });
  });

  router.get('/api/v1/storage/*', storageAuth(signingSecret), async (req: Request, res: Response) => {
    // Express puts the wildcard portion (everything after /api/v1/storage/) in params[0]
    const key = req.params[0];

    if (!key) {
      res.status(400).json({ errors: [{ message: 'Storage key is required' }] });
      return;
    }

    const filename =
      typeof req.query['filename'] === 'string' ? req.query['filename'] : undefined;
    const disposition =
      req.query['disposition'] === 'inline' ? 'inline' : undefined;

    const result = await storageProvider.get(key);

    res.setHeader('Content-Type', result.contentType);
    // The dispatch-ui previews uploaded documents (PDFs, images) inside an
    // iframe / <img> tag. The global helmet CSP sets `frame-ancestors 'self'`
    // and we add `X-Frame-Options: DENY` for the API itself, but those headers
    // would block the dispatch-ui from rendering files served by the dev-only
    // local storage backend. Override them here so previewing works in dev.
    res.removeHeader('X-Frame-Options');
    res.setHeader('Content-Security-Policy', "frame-ancestors *");
    if (disposition === 'inline') {
      res.setHeader('Content-Disposition', 'inline');
    } else if (filename !== undefined) {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    } else {
      res.setHeader('Content-Disposition', 'inline');
    }
    result.body.pipe(res);
  });

  return router;
};
