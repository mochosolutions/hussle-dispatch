import type { Logger } from '../../shared/utils/logger';
import type { NotificationService, EmailAttachment } from '../../shared/notifications/notificationService';
import type { SettlementRepoPort, SettlementWithRelations, SendSettlementInput } from '../types/settlementTypes';
import type { SettlementPdfGenerationPort } from './settlementPdfGenerationService';
import Decimal from 'decimal.js';
import { renderSettlementEmail } from '@/shared/emails';
import { buildSettlementPdfData } from './settlementPdfDataBuilder';
import { ValidationError, NotFoundError } from '../../shared/errors/commonErrors';

interface SettlementEmailServiceDeps {
  settlementRepo: SettlementRepoPort;
  pdfService: SettlementPdfGenerationPort;
  notificationService: NotificationService;
  fromEmail: string;
  logger: Logger;
}

export interface SettlementEmailService {
  sendSettlementEmail(input: SendSettlementInput): Promise<SettlementWithRelations>;
}

const resolveRecipient = (
  settlement: SettlementWithRelations,
): { email: string; name: string } => {
  // COMPANY_ASSET settlements go to the driver; all other carrier types go to the carrier email
  if (settlement.carrier.type === 'COMPANY_ASSET' && settlement.driver) {
    const driverEmail = settlement.driver.email;
    if (driverEmail) {
      return {
        email: driverEmail,
        name: `${settlement.driver.firstName} ${settlement.driver.lastName}`,
      };
    }
  }

  // Fallback to carrier email
  const carrierEmail = settlement.carrier.email;
  if (carrierEmail) {
    return { email: carrierEmail, name: settlement.carrier.name };
  }

  throw new ValidationError('No recipient email found for this settlement');
};

const formatDate = (d: Date): string =>
  d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });

export const createSettlementEmailService = (
  deps: SettlementEmailServiceDeps,
): SettlementEmailService => ({
  sendSettlementEmail: async (input) => {
    // 1. Fetch settlement
    const settlement = await deps.settlementRepo.findById(input.settlementId, input.organizationId);
    if (!settlement) {
      throw new NotFoundError(`Settlement ${input.settlementId} not found`);
    }

    // 2. Validate status (only APPROVED or PAID)
    if (settlement.status !== 'APPROVED' && settlement.status !== 'PAID') {
      throw new ValidationError('Can only send email for APPROVED or PAID settlements');
    }

    // 3. Resolve recipient
    const recipient = resolveRecipient(settlement);

    // 4. Generate PDF
    const pdfData = buildSettlementPdfData(settlement);
    const pdfBuffer = await deps.pdfService.generateSettlementPdf(pdfData);

    // 5. Render email
    const netDecimal = new Decimal(String(settlement.netEarnings));
    const { subject, html } = await renderSettlementEmail({
      settlementNumber: settlement.settlementNumber,
      periodStart: formatDate(settlement.periodStart),
      periodEnd: formatDate(settlement.periodEnd),
      recipientName: recipient.name,
      netEarnings: `$${netDecimal.toFixed(2)}`,
    });

    // 6. Send email with PDF attachment
    const attachments: EmailAttachment[] = [
      {
        filename: `Settlement_${settlement.settlementNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ];

    await deps.notificationService.sendEmail({
      to: recipient.email,
      from: deps.fromEmail,
      subject,
      html,
      attachments,
    });

    // 7. Update settlement with sent tracking
    const updated = await deps.settlementRepo.update(input.settlementId, input.organizationId, {
      sentAt: new Date(),
      sentToEmail: recipient.email,
    });

    deps.logger.info('Settlement email sent', {
      settlementId: settlement.id,
      recipientEmail: recipient.email,
    });

    return updated;
  },
});
