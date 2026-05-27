import type { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from '@/shared/utils/logger';

const parseList = (value: string): string[] =>
  value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

/**
 * Configure security middleware for the Express application.
 * Applies Helmet headers, additional response headers, and CORS with an
 * allowlist driven by `ALLOW_ORIGINS` and (optionally) `ALLOWED_EXTENSION_IDS`.
 */
export const configureSecurity = (app: Application): void => {
  // Helmet — security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hsts:
        process.env.NODE_ENV === 'production'
          ? { maxAge: 31536000, includeSubDomains: true, preload: true }
          : false,
    }),
  );

  const allowedOrigins =
    process.env.ALLOW_ORIGINS !== undefined && process.env.ALLOW_ORIGINS !== ''
      ? parseList(process.env.ALLOW_ORIGINS)
      : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3002'];

  const allowedExtensionIds = parseList(process.env['ALLOWED_EXTENSION_IDS'] ?? '');
  const allowedExtensionOrigins = allowedExtensionIds.map((id) => `chrome-extension://${id}`);

  logger.debug('Security middleware configured', {
    allowedOrigins,
    allowedExtensionOrigins,
  });

  app.use(
    cors({
      origin: (origin, callback) => {
        // Reject requests with no origin in production (prevents CORS bypass)
        if (origin === undefined) {
          if (process.env.NODE_ENV === 'production') {
            callback(new Error('Not allowed by CORS'));
            return;
          }
          // Allow no-origin in development (server-to-server, Postman, etc.)
          callback(null, true);
          return;
        }

        if (allowedOrigins.includes(origin) || allowedExtensionOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
      exposedHeaders: ['Content-Range', 'X-Content-Range'],
      maxAge: 86400,
    }),
  );

  // Additional security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });
};
