import type Decimal from 'decimal.js';
import type { EventBus } from '../../shared/messaging/eventBus';
import type { Logger } from '../../shared/utils/logger';
import type { InvoiceRepoPort, InvoiceLoadQueryPort } from '../types/invoiceTypes';
import type { DocumentQueryPort } from '../types/documentPacketTypes';
import type { OrgSettingsQueryPort } from '../types/readinessTypes';
import type { InvoiceBuilderService } from './invoiceBuilderService';
import type { InvoiceEmailService } from './invoiceEmailService';
import { generateSequenceNumber } from '../../shared/sequenceGenerator';
import { generateTonuInvoice } from './invoiceGenerationService';

interface ReadinessSubscriberDeps {
  eventBus: EventBus;
  invoiceRepo: InvoiceRepoPort;
  loadQuery: InvoiceLoadQueryPort;
  documentQuery: DocumentQueryPort;
  orgSettingsQuery: OrgSettingsQueryPort;
  invoiceBuilderService: InvoiceBuilderService;
  invoiceEmailService: InvoiceEmailService;
  logger: Logger;
}

const createDispatchFeeInvoice = async (
  params: {
    loadId: string;
    organizationId: string;
    loadNumber: string;
    carrierId: string;
    carrierBillingMethod: string;
    carrierPrimaryContactEmail: string | null;
    dispatchFeeAmount: Decimal;
  },
  deps: ReadinessSubscriberDeps,
): Promise<void> => {
  // Idempotency: skip if a DISPATCH_FEE invoice already exists for this load.
  const existingInvoices = await deps.invoiceRepo.findManyByLoadId(
    params.loadId,
    params.organizationId,
  );
  const alreadyExists = existingInvoices.some(
    (inv) => inv.type === 'DISPATCH_FEE' && inv.status !== 'VOID',
  );
  if (alreadyExists) {
    deps.logger.info('DISPATCH_FEE invoice already exists for load, skipping', {
      loadId: params.loadId,
    });
    return;
  }

  const invoiceNumber = await generateSequenceNumber('INVOICE', params.organizationId);
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  const feeAmount = params.dispatchFeeAmount.toNumber();

  const invoice = await deps.invoiceRepo.create({
    loadId: params.loadId,
    carrierId: params.carrierId,
    invoiceNumber,
    type: 'DISPATCH_FEE',
    subtotal: feeAmount,
    accessorials: 0,
    totalAmount: feeAmount,
    paymentTerms: 'net_30',
    paymentTermsDays: 30,
    dueDate,
    missingSignedBol: false,
    notes: `Dispatch fee for load #${params.loadNumber}`,
  });

  await deps.eventBus.publish('invoice.draft.created', {
    invoiceId: invoice.id,
    loadId: params.loadId,
    organizationId: params.organizationId,
    invoiceNumber,
  });

  deps.logger.info('DISPATCH_FEE invoice created', {
    invoiceId: invoice.id,
    loadId: params.loadId,
    amount: params.dispatchFeeAmount.toFixed(2),
  });

  // FACTORED carriers settle the dispatch fee through factoring submission,
  // not direct email — leave the invoice in DRAFT and skip the auto-send.
  if (params.carrierBillingMethod === 'FACTORED') {
    deps.logger.info('dispatch_fee_invoice_auto_send_skipped_factoring', {
      invoiceId: invoice.id,
      carrierId: params.carrierId,
    });
    return;
  }

  // Route to carrier primary contact email. If missing, flag and skip send.
  if (
    params.carrierPrimaryContactEmail === null ||
    params.carrierPrimaryContactEmail.length === 0
  ) {
    deps.logger.warn('DISPATCH_FEE invoice created without carrier primary contact email; skipping send', {
      invoiceId: invoice.id,
      carrierId: params.carrierId,
    });
    return;
  }

  try {
    await deps.invoiceEmailService.sendInvoiceEmail({
      invoiceId: invoice.id,
      organizationId: params.organizationId,
      recipientEmail: params.carrierPrimaryContactEmail,
      fromEmail: 'invoices@fleetcommand.app',
    });
  } catch (error: unknown) {
    deps.logger.error('Failed to send DISPATCH_FEE invoice email', {
      invoiceId: invoice.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

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

  // US-13: invoiceReadiness is now computed on-read (US-11). The previous
  // updateLoadStatus(loadId, load.status) call here was a no-op (rewrote the
  // same status); removed. The `readiness` variable below is still used to
  // gate auto-invoice creation.

  // Check org settings for auto behavior
  if (readiness === 'READY') {
    const orgSettings = await deps.orgSettingsQuery.findByOrganizationId(load.organizationId);
    const workflow = orgSettings?.invoiceWorkflow ?? 'AUTO_REVIEW';

    if (workflow === 'AUTO_REVIEW' || workflow === 'AUTO_SEND') {
      try {
        const { invoice: customerInvoice, dispatchFeeAmount } =
          await deps.invoiceBuilderService.createFromLoadWithFee({
            loadId,
            organizationId: load.organizationId,
            userId: 'system',
          });

        readiness = 'INVOICE_CREATED';

        deps.logger.info('Auto-created invoice draft', { loadId, workflow });

        // Auto-send CUSTOMER invoice email (gated by customer.billingMethod).
        // Skip if customer is FACTORED — those go via factoring submission, not
        // direct email. Also skip if invoice is not in DRAFT (idempotency).
        if (customerInvoice.status === 'DRAFT') {
          const customerBillingMethod = load.customer?.billingMethod ?? 'DIRECT';

          if (customerBillingMethod === 'FACTORED') {
            deps.logger.info('customer_invoice_auto_send_skipped_factoring', {
              invoiceId: customerInvoice.id,
              customerId: load.customerId,
            });
          } else {
            const recipientEmail =
              load.contact?.email ?? load.customer?.email ?? null;

            if (recipientEmail === null || recipientEmail.length === 0) {
              deps.logger.warn(
                'CUSTOMER invoice auto-send skipped: no recipient email found',
                {
                  invoiceId: customerInvoice.id,
                  loadId,
                  customerId: load.customerId,
                },
              );
            } else {
              try {
                await deps.invoiceEmailService.sendInvoiceEmail({
                  invoiceId: customerInvoice.id,
                  organizationId: load.organizationId,
                  recipientEmail,
                  fromEmail: 'invoices@fleetcommand.app',
                });
              } catch (error: unknown) {
                deps.logger.error('Failed to auto-send CUSTOMER invoice email', {
                  invoiceId: customerInvoice.id,
                  error: error instanceof Error ? error.message : String(error),
                });
              }
            }
          }
        }

        // For EXTERNAL_CARRIER, create a second DISPATCH_FEE invoice billed to the carrier.
        if (
          dispatchFeeAmount !== null &&
          load.carrier?.type === 'EXTERNAL_CARRIER' &&
          load.carrierId !== null &&
          load.carrierId !== undefined &&
          dispatchFeeAmount.gt(0)
        ) {
          await createDispatchFeeInvoice(
            {
              loadId,
              organizationId: load.organizationId,
              loadNumber: load.loadNumber,
              carrierId: load.carrierId,
              carrierBillingMethod: load.carrier.billingMethod ?? 'DIRECT',
              carrierPrimaryContactEmail: load.carrier.primaryContact?.email ?? null,
              dispatchFeeAmount,
            },
            deps,
          );
        }
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
        eventBus: deps.eventBus,
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
