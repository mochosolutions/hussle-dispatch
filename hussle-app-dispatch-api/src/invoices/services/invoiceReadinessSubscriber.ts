import type { EventBus } from '../../shared/messaging/eventBus';
import type { Logger } from '../../shared/utils/logger';
import type { InvoiceRepoPort, InvoiceLoadQueryPort } from '../types/invoiceTypes';
import type { DocumentQueryPort } from '../types/documentPacketTypes';
import type { OrgSettingsQueryPort } from '../types/readinessTypes';
import type { InvoiceBuilderService } from './invoiceBuilderService';
import { generateTonuInvoice } from './invoiceGenerationService';

interface ReadinessSubscriberDeps {
  eventBus: EventBus;
  invoiceRepo: InvoiceRepoPort;
  loadQuery: InvoiceLoadQueryPort;
  documentQuery: DocumentQueryPort;
  orgSettingsQuery: OrgSettingsQueryPort;
  invoiceBuilderService: InvoiceBuilderService;
  logger: Logger;
}

const REQUIRED_DOC_TYPES = ['BROKER_RATE_CON', 'BOL_SIGNED', 'POD'];

const evaluateReadiness = async (
  loadId: string,
  deps: ReadinessSubscriberDeps,
): Promise<void> => {
  const load = await deps.loadQuery.findLoadById(loadId);

  if (load === null) {
    return;
  }

  // Only evaluate for DELIVERED or INVOICE_PENDING loads
  const evaluableStatuses = ['DELIVERED', 'INVOICE_PENDING'];
  if (!evaluableStatuses.includes(load.status)) {
    return;
  }

  // Check for existing non-void invoice
  const existingInvoice = await deps.invoiceRepo.findNonVoidByLoadId(loadId, load.organizationId);
  if (existingInvoice !== null) {
    await deps.loadQuery.updateLoadStatus(loadId, 'INVOICE_PENDING');
    return;
  }

  // Check document completeness
  const documents = await deps.documentQuery.findConfirmedByEntity('load', loadId);
  const docTypes = documents.map((d) => d.type);

  const hasRateCon = docTypes.includes('BROKER_RATE_CON');
  const hasSignedBol = docTypes.includes('BOL_SIGNED');
  const hasPod = docTypes.includes('POD');
  const allDocsPresent = hasRateCon && hasSignedBol && hasPod;

  // Determine readiness
  let readiness: string;

  if (!evaluableStatuses.includes(load.status)) {
    readiness = 'NOT_READY';
  } else if (!allDocsPresent) {
    readiness = 'AWAITING_DOCUMENTS';
  } else {
    readiness = 'READY';
  }

  // Update load readiness field
  await deps.loadQuery.updateLoadStatus(loadId, load.status);

  // Check org settings for auto behavior
  if (readiness === 'READY') {
    const orgSettings = await deps.orgSettingsQuery.findByOrganizationId(load.organizationId);
    const workflow = orgSettings?.invoiceWorkflow ?? 'AUTO_REVIEW';

    if (workflow === 'AUTO_REVIEW' || workflow === 'AUTO_SEND') {
      try {
        await deps.invoiceBuilderService.createFromLoad({
          loadId,
          organizationId: load.organizationId,
          userId: 'system',
        });

        readiness = 'INVOICE_CREATED';

        deps.logger.info('Auto-created invoice draft', { loadId, workflow });
      } catch (error: unknown) {
        deps.logger.warn('Auto-invoice creation failed', {
          loadId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  deps.logger.info('Invoice readiness evaluated', {
    loadId,
    readiness,
    hasRateCon,
    hasSignedBol,
    hasPod,
  });
};

export const initializeReadinessSubscriber = async (
  deps: ReadinessSubscriberDeps,
): Promise<void> => {
  await deps.eventBus.subscribe(
    'load.status.changed',
    'invoice-readiness',
    async (data) => {
      try {
        if (data.toStatus === 'DELIVERED') {
          await evaluateReadiness(data.loadId, deps);
        }
      } catch (error: unknown) {
        deps.logger.error('Readiness evaluation failed on status change', {
          loadId: data.loadId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  await deps.eventBus.subscribe(
    'document.confirmed',
    'invoice-readiness',
    async (data) => {
      try {
        if (data.entityType === 'load') {
          await evaluateReadiness(data.entityId, deps);
        }
      } catch (error: unknown) {
        deps.logger.error('Readiness evaluation failed on document confirm', {
          entityId: data.entityId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  await deps.eventBus.subscribe(
    'load.delivered',
    'invoice-readiness',
    async (data) => {
      try {
        await evaluateReadiness(data.loadId, deps);
      } catch (error: unknown) {
        deps.logger.error('Readiness evaluation failed on load delivered', {
          loadId: data.loadId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  await deps.eventBus.subscribe(
    'load.tonu',
    'invoice-readiness',
    async (data) => {
      const tonuDeps = {
        invoiceRepo: deps.invoiceRepo,
        loadQuery: deps.loadQuery,
        logger: deps.logger,
      };

      try {
        await generateTonuInvoice(data.loadId, data.organizationId, tonuDeps);
      } catch (error: unknown) {
        deps.logger.error('Failed to generate TONU invoice from event', {
          loadId: data.loadId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  deps.logger.info('Invoice readiness subscriber initialized');
};
