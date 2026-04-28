/**
 * Local type definitions for the PDF template components.
 * These types describe the shape the @react-pdf/renderer template expects,
 * independent of the feature-level invoice types.
 */

export interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Accessorial {
  description: string;
  amount: number;
}

export interface InvoiceAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface InvoiceBillTo {
  name: string;
  address: InvoiceAddress;
  phone?: string;
  email?: string;
}

export interface InvoiceLoadDetails {
  loadNumber: string;
  route: string;
  pickupDate: string;
  deliveryDate: string;
}

export interface InvoiceOrgSettings {
  companyName: string;
  companyLogoUrl?: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  paymentTerms: string;
  billTo: InvoiceBillTo;
  loadDetails: InvoiceLoadDetails;
  lineItems: readonly LineItem[];
  accessorials: readonly Accessorial[];
  subtotal: number;
  accessorialsTotal: number;
  grandTotal: number;
  orgSettings: InvoiceOrgSettings;
  paymentInstructions?: string;
  notes?: string;
}
