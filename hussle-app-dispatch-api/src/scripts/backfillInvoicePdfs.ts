#!/usr/bin/env ts-node
import 'dotenv/config';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { s3Client } from '../config/s3';
import { logger } from '../shared/utils/logger';
import { createStorageProvider } from '../shared/storage';
import { createBrowserPool } from '../shared/providers/puppeteerBrowserPool';
import {
  invoiceRepositoryPrisma,
  invoiceLoadQueryPrisma,
} from '../invoices/repositories/invoiceRepositoryPrisma';
import { orgSettingsQueryPrisma } from '../invoices/repositories/orgSettingsQueryPrisma';
import { createPdfGenerationService } from '../invoices/services/pdfGenerationService';
import { buildInvoicePdfData } from '../invoices/services/invoicePdfDataBuilder';

/**
 * One-time backfill: generates + stores a PDF for every Invoice row where
 * pdfUrl IS NULL and status != 'VOID'. Idempotent — re-runs skip invoices
 * that have a pdfUrl by the time they're re-fetched.
 *
 * Mirrors the generation pipeline of invoicePdfGenerationSubscriber so the
 * artifact landed by either path is byte-equivalent (same template, same key).
 *
 * Run via: `npm run db:backfill-invoice-pdfs`
 */
const main = async (): Promise<void> => {
  const invoiceRepo = invoiceRepositoryPrisma(prisma);
  const loadQuery = invoiceLoadQueryPrisma(prisma);
  const orgSettingsQuery = orgSettingsQueryPrisma(prisma);

  const storageProvider = createStorageProvider(
    env.STORAGE_BACKEND === 's3'
      ? {
          backend: 's3',
          s3Client,
          bucket: env.S3_BUCKET,
          region: env.AWS_REGION,
        }
      : {
          backend: 'local',
          basePath: env.STORAGE_LOCAL_PATH,
          baseUrl: `http://localhost:${String(env.PORT)}/api/v1/storage`,
        },
    logger,
  );

  const browserPool = createBrowserPool({ maxPages: 1, logger });
  const pdfService = createPdfGenerationService({ browserPool, logger });

  const candidates = await prisma.invoice.findMany({
    where: {
      pdfUrl: null,
      status: { not: 'VOID' },
    },
    select: { id: true, invoiceNumber: true, loadId: true },
  });

  logger.info('Backfill: scan complete', { candidateCount: candidates.length });

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const stub of candidates) {
    try {
      const load = await prisma.load.findUnique({
        where: { id: stub.loadId },
        select: { organizationId: true },
      });

      if (load === null) {
        logger.warn('Backfill: load not found for invoice, skipping', {
          invoiceId: stub.id,
          loadId: stub.loadId,
        });
        skipped += 1;
        continue;
      }

      const invoice = await invoiceRepo.findById(stub.id, load.organizationId);
      if (invoice === null) {
        logger.warn('Backfill: invoice disappeared between scan and fetch, skipping', {
          invoiceId: stub.id,
        });
        skipped += 1;
        continue;
      }

      if (invoice.pdfUrl !== null && invoice.pdfUrl !== undefined && invoice.pdfUrl !== '') {
        logger.info('Backfill: pdfUrl set since scan, skipping', {
          invoiceId: invoice.id,
          pdfUrl: invoice.pdfUrl,
        });
        skipped += 1;
        continue;
      }

      const pdfData = await buildInvoicePdfData(invoice, { loadQuery, orgSettingsQuery, logger });
      const pdfBuffer = await pdfService.generateInvoicePdf(pdfData);
      const storageKey = `invoices/${invoice.invoiceNumber}.pdf`;
      await storageProvider.put(storageKey, pdfBuffer, 'application/pdf');
      await invoiceRepo.updateStatus(invoice.id, load.organizationId, invoice.status, {
        pdfUrl: storageKey,
      });

      logger.info('Backfill: PDF generated + persisted', {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        storageKey,
        bytes: pdfBuffer.length,
      });
      generated += 1;
    } catch (error: unknown) {
      failed += 1;
      logger.error('Backfill: failed for invoice', {
        invoiceId: stub.id,
        invoiceNumber: stub.invoiceNumber,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  logger.info('Backfill: complete', {
    candidateCount: candidates.length,
    generated,
    skipped,
    failed,
  });

  await browserPool.shutdown?.();
  await prisma.$disconnect();
};

main().catch((error: unknown) => {
  logger.error('Backfill: fatal error', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  process.exit(1);
});
