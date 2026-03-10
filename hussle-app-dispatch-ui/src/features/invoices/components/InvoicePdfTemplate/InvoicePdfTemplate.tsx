import { Document, Page, View, Text, Image } from '@react-pdf/renderer';

import type { InvoiceData, LineItem, Accessorial } from '../../types';
import { formatCurrency } from './formatCurrency';
import { pdfStyles } from './pdfStyles';

interface InvoicePdfTemplateProps {
  invoice: InvoiceData;
}

const formatAddress = (address: { street: string; city: string; state: string; zip: string }) =>
  `${address.street}, ${address.city}, ${address.state} ${address.zip}`;

const InvoicePdfHeader: React.FC<{
  companyName: string;
  companyLogoUrl?: string;
  invoiceDate: string;
}> = ({ companyName, companyLogoUrl, invoiceDate }) => (
  <View style={pdfStyles.header}>
    <View style={pdfStyles.headerLeft}>
      {companyLogoUrl ? (
        <Image src={companyLogoUrl} style={pdfStyles.companyLogo} />
      ) : null}
      <View>
        <Text style={pdfStyles.companyName}>{companyName}</Text>
        <Text style={pdfStyles.companyDate}>{invoiceDate}</Text>
      </View>
    </View>
    <Text style={pdfStyles.invoiceTitle}>INVOICE</Text>
  </View>
);

const InvoiceDetailsSection: React.FC<{
  invoice: InvoiceData;
}> = ({ invoice }) => (
  <View style={pdfStyles.detailsSection}>
    <View style={pdfStyles.detailsColumn}>
      <Text style={pdfStyles.sectionTitle}>Invoice Details</Text>
      <View style={pdfStyles.detailRow}>
        <Text style={pdfStyles.detailLabel}>Invoice #:</Text>
        <Text style={pdfStyles.detailValue}>{invoice.invoiceNumber}</Text>
      </View>
      <View style={pdfStyles.detailRow}>
        <Text style={pdfStyles.detailLabel}>Invoice Date:</Text>
        <Text style={pdfStyles.detailValue}>{invoice.invoiceDate}</Text>
      </View>
      <View style={pdfStyles.detailRow}>
        <Text style={pdfStyles.detailLabel}>Due Date:</Text>
        <Text style={pdfStyles.detailValue}>{invoice.dueDate}</Text>
      </View>
      <View style={pdfStyles.detailRow}>
        <Text style={pdfStyles.detailLabel}>Payment Terms:</Text>
        <Text style={pdfStyles.detailValue}>{invoice.paymentTerms}</Text>
      </View>
    </View>

    <View style={pdfStyles.detailsColumn}>
      <Text style={pdfStyles.sectionTitle}>Bill To</Text>
      <Text style={pdfStyles.billToName}>{invoice.billTo.name}</Text>
      <Text style={pdfStyles.billToText}>{formatAddress(invoice.billTo.address)}</Text>
      {invoice.billTo.phone ? (
        <Text style={pdfStyles.billToText}>{invoice.billTo.phone}</Text>
      ) : null}
      {invoice.billTo.email ? (
        <Text style={pdfStyles.billToText}>{invoice.billTo.email}</Text>
      ) : null}
    </View>
  </View>
);

const LoadDetailsSection: React.FC<{
  loadDetails: InvoiceData['loadDetails'];
}> = ({ loadDetails }) => (
  <View style={pdfStyles.loadSection}>
    <Text style={pdfStyles.sectionTitle}>Load Details</Text>
    <View style={pdfStyles.detailRow}>
      <Text style={pdfStyles.detailLabel}>Load #:</Text>
      <Text style={pdfStyles.detailValue}>{loadDetails.loadNumber}</Text>
    </View>
    <View style={pdfStyles.detailRow}>
      <Text style={pdfStyles.detailLabel}>Route:</Text>
      <Text style={pdfStyles.detailValue}>{loadDetails.route}</Text>
    </View>
    <View style={pdfStyles.detailRow}>
      <Text style={pdfStyles.detailLabel}>Pickup Date:</Text>
      <Text style={pdfStyles.detailValue}>{loadDetails.pickupDate}</Text>
    </View>
    <View style={pdfStyles.detailRow}>
      <Text style={pdfStyles.detailLabel}>Delivery Date:</Text>
      <Text style={pdfStyles.detailValue}>{loadDetails.deliveryDate}</Text>
    </View>
  </View>
);

const LineItemsTable: React.FC<{
  lineItems: readonly LineItem[];
}> = ({ lineItems }) => (
  <View style={pdfStyles.table}>
    <Text style={pdfStyles.sectionTitle}>Line Items</Text>
    <View style={pdfStyles.tableHeader}>
      <Text style={[pdfStyles.tableHeaderText, pdfStyles.colDescription]}>Description</Text>
      <Text style={[pdfStyles.tableHeaderText, pdfStyles.colQuantity]}>Qty</Text>
      <Text style={[pdfStyles.tableHeaderText, pdfStyles.colRate]}>Rate</Text>
      <Text style={[pdfStyles.tableHeaderText, pdfStyles.colAmount]}>Amount</Text>
    </View>
    {lineItems.map((item, index) => (
      <View
        key={`line-item-${item.description}-${index}`}
        style={index % 2 === 0 ? pdfStyles.tableRow : pdfStyles.tableRowAlt}
      >
        <Text style={[pdfStyles.tableCell, pdfStyles.colDescription]}>{item.description}</Text>
        <Text style={[pdfStyles.tableCell, pdfStyles.colQuantity]}>{item.quantity}</Text>
        <Text style={[pdfStyles.tableCell, pdfStyles.colRate]}>{formatCurrency(item.rate)}</Text>
        <Text style={[pdfStyles.tableCell, pdfStyles.colAmount]}>
          {formatCurrency(item.amount)}
        </Text>
      </View>
    ))}
  </View>
);

const AccessorialsSection: React.FC<{
  accessorials: readonly Accessorial[];
}> = ({ accessorials }) => {
  if (accessorials.length === 0) {
    return null;
  }

  return (
    <View style={pdfStyles.accessorialSection}>
      <Text style={pdfStyles.sectionTitle}>Accessorials</Text>
      {accessorials.map((accessorial, index) => (
        <View
          key={`accessorial-${accessorial.description}-${index}`}
          style={pdfStyles.accessorialRow}
        >
          <Text style={pdfStyles.tableCell}>{accessorial.description}</Text>
          <Text style={pdfStyles.tableCell}>{formatCurrency(accessorial.amount)}</Text>
        </View>
      ))}
    </View>
  );
};

const TotalsSection: React.FC<{
  subtotal: number;
  accessorialsTotal: number;
  grandTotal: number;
}> = ({ subtotal, accessorialsTotal, grandTotal }) => (
  <View style={pdfStyles.totalsSection}>
    <View style={pdfStyles.totalsContainer}>
      <View style={pdfStyles.totalRow}>
        <Text style={pdfStyles.totalLabel}>Subtotal</Text>
        <Text style={pdfStyles.totalValue}>{formatCurrency(subtotal)}</Text>
      </View>
      {accessorialsTotal > 0 ? (
        <View style={pdfStyles.totalRow}>
          <Text style={pdfStyles.totalLabel}>Accessorials</Text>
          <Text style={pdfStyles.totalValue}>{formatCurrency(accessorialsTotal)}</Text>
        </View>
      ) : null}
      <View style={pdfStyles.grandTotalRow}>
        <Text style={pdfStyles.grandTotalLabel}>Grand Total</Text>
        <Text style={pdfStyles.grandTotalValue}>{formatCurrency(grandTotal)}</Text>
      </View>
    </View>
  </View>
);

const InvoiceFooter: React.FC<{
  paymentInstructions?: string;
  notes?: string;
}> = ({ paymentInstructions, notes }) => (
  <View style={pdfStyles.footer}>
    {paymentInstructions ? (
      <View>
        <Text style={pdfStyles.footerTitle}>Payment Instructions</Text>
        <Text style={pdfStyles.footerText}>{paymentInstructions}</Text>
      </View>
    ) : null}
    {notes ? (
      <View style={pdfStyles.notesSection}>
        <Text style={pdfStyles.footerTitle}>Notes</Text>
        <Text style={pdfStyles.footerText}>{notes}</Text>
      </View>
    ) : null}
  </View>
);

const InvoicePdfTemplate: React.FC<InvoicePdfTemplateProps> = ({ invoice }) => (
  <Document>
    <Page size="LETTER" style={pdfStyles.page}>
      <InvoicePdfHeader
        companyName={invoice.orgSettings.companyName}
        companyLogoUrl={invoice.orgSettings.companyLogoUrl}
        invoiceDate={invoice.invoiceDate}
      />

      <InvoiceDetailsSection invoice={invoice} />

      <LoadDetailsSection loadDetails={invoice.loadDetails} />

      <LineItemsTable lineItems={invoice.lineItems} />

      <AccessorialsSection accessorials={invoice.accessorials} />

      <TotalsSection
        subtotal={invoice.subtotal}
        accessorialsTotal={invoice.accessorialsTotal}
        grandTotal={invoice.grandTotal}
      />

      <InvoiceFooter
        paymentInstructions={invoice.paymentInstructions}
        notes={invoice.notes}
      />
    </Page>
  </Document>
);

export { InvoicePdfTemplate };
export type { InvoicePdfTemplateProps };
