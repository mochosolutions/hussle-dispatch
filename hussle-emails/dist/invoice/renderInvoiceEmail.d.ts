export type InvoiceEmailType = 'CUSTOMER' | 'DISPATCH_FEE';
export interface InvoiceEmailData {
    invoiceNumber: string;
    loadNumber: string;
    carrierName: string;
    totalAmount: string;
    dueDate: string;
    paymentTerms: string;
    replyToEmail: string;
    invoiceType?: InvoiceEmailType;
    senderName?: string;
}
export declare const renderInvoiceEmail: (data: InvoiceEmailData) => Promise<{
    subject: string;
    html: string;
}>;
