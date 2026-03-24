import cors from 'cors';
import type { Application } from 'express';
import helmet from 'helmet';

/**
 * Configure security middleware for the Express application
 * Includes Helmet for security headers and CORS for cross-origin requests
 */
export const configureSecurity = (app: Application): void => {
  // Helmet.js - Security headers
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
      crossOriginEmbedderPolicy: false, // Allow embedding for admin UI
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin requests
      hsts:
        process.env.NODE_ENV === 'production'
          ? { maxAge: 31536000, includeSubDomains: true, preload: true }
          : false,
    }),
  );

  console.log('Security middleware configured: Helmet with custom CSP and CORS enabled', {
    origin: process.env.ALLOW_ORIGINS,
  });

  // CORS Configuration
  const allowedOrigins = process.env.ALLOW_ORIGINS?.split(',').map((origin) => origin.trim()) ?? [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3002',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Reject requests with no origin in production (prevents CORS bypass)
        if (!origin) {
          if (process.env.NODE_ENV === 'production') {
            return callback(new Error('Not allowed by CORS'));
          }
          // Allow no-origin in development (server-to-server, Postman, etc.)
          return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          // logger.warn(`CORS blocked origin: ${origin}`);
          // return callback(null, true);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true, // Allow cookies
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
      exposedHeaders: ['Content-Range', 'X-Content-Range'],
      maxAge: 86400, // 24 hours
    }),
  );

  // Additional security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });
};
