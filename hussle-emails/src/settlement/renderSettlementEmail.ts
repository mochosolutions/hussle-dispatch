import { render } from '@react-email/components';
import SettlementEmail from './SettlementEmail';

export interface SettlementEmailData {
  settlementNumber: string;
  periodStart: string;
  periodEnd: string;
  recipientName: string;
  netEarnings: string;
}

export const renderSettlementEmail = async (
  data: SettlementEmailData,
): Promise<{ subject: string; html: string }> => ({
  subject: `Settlement ${data.settlementNumber} — ${data.periodStart} to ${data.periodEnd}`,
  html: await render(SettlementEmail(data)),
});
