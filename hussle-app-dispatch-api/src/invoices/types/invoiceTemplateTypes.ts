// ---------------------------------------------------------------------------
// Invoice PDF template data — passed to the React template component
// ---------------------------------------------------------------------------

export interface InvoiceTemplateStop {
  type: string;
  facilityName: string | null;
  city: string | null;
  state: string | null;
  appointmentDate: string | null;
  arrivalTime: string | null;
  departureTime: string | null;
}

export interface InvoiceTemplateAccessorial {
  type: string;
  description: string | null;
  amount: string;
}

export interface InvoiceTemplateData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  paymentTerms: string;
  status: string;

  // Carrier / bill-from
  carrierName: string;
  carrierAddress: string | null;
  carrierCityStateZip: string | null;
  carrierPhone: string | null;
  carrierEmail: string | null;
  carrierMcNumber: string | null;

  // Bill-to (customer or factoring company)
  billToName: string;
  billToAddress: string | null;
  billToCityStateZip: string | null;
  billToEmail: string | null;

  // Org branding
  companyLogoUrl: string | null;

  // Load details
  loadNumber: string;
  externalRefNumber: string | null;
  equipmentType: string | null;
  commodity: string | null;
  weight: number | null;
  totalMiles: number | null;

  // Route
  stops: InvoiceTemplateStop[];

  // Financials
  subtotal: string;
  accessorials: InvoiceTemplateAccessorial[];
  accessorialsTotal: string;
  totalAmount: string;

  // Factoring (optional)
  billingMethod: string;
  factoringCompanyName: string | null;
  factoringNoa: string | null;
  factoringAdvance: string | null;
  factoringFeeAmount: string | null;
  reserveAmount: string | null;

  // Notes
  notes: string | null;
}

// ---------------------------------------------------------------------------
// PDF generation port
// ---------------------------------------------------------------------------

export interface PdfGenerationPort {
  generateInvoicePdf(data: InvoiceTemplateData): Promise<Buffer>;
}
