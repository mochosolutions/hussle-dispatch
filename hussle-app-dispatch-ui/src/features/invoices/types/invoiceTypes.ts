interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

interface CompanyInfo {
  name: string;
  address: Address;
  phone?: string;
  email?: string;
}

interface OrgSettings {
  companyName: string;
  companyLogoUrl?: string;
  address: Address;
  phone?: string;
  email?: string;
}

type InvoiceType = 'carrier' | 'broker';

type PaymentTerms = 'Net 15' | 'Net 30' | 'Net 45' | 'Net 60' | 'Due on Receipt';

interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Accessorial {
  description: string;
  amount: number;
}

interface LoadDetails {
  loadNumber: string;
  route: string;
  pickupDate: string;
  deliveryDate: string;
}

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  paymentTerms: PaymentTerms;
  invoiceType: InvoiceType;
  billTo: CompanyInfo;
  orgSettings: OrgSettings;
  loadDetails: LoadDetails;
  lineItems: readonly LineItem[];
  accessorials: readonly Accessorial[];
  subtotal: number;
  accessorialsTotal: number;
  grandTotal: number;
  paymentInstructions?: string;
  notes?: string;
}

export type {
  Address,
  CompanyInfo,
  OrgSettings,
  InvoiceType,
  PaymentTerms,
  LineItem,
  Accessorial,
  LoadDetails,
  InvoiceData,
};
