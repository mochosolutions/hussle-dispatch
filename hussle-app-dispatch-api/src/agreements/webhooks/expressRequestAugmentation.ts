/**
 * Request augmentation for the DocuSeal webhook subtree.
 *
 * `express.raw` writes the raw request bytes to `req.body` as a Buffer. The
 * webhook route shuffles those bytes onto `req.rawBody` before HMAC verification
 * so the controller can later reassign `req.body` to the parsed JSON without
 * losing the bytes that were signed.
 */
declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

export {};
