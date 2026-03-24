// ---------------------------------------------------------------------------
// Invoice email service types
// ---------------------------------------------------------------------------

export interface SendInvoiceEmailInput {
  invoiceId: string;
  recipientEmail: string;
  replyToEmail?: string;
  fromEmail: string;
  subject: string;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface InvoiceEmailPort {
  sendInvoiceEmail(input: SendInvoiceEmailInput): Promise<void>;
}

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  secure: boolean;
}
