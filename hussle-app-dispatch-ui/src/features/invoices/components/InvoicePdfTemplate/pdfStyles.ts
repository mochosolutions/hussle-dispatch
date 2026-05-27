import { StyleSheet } from '@react-pdf/renderer';

const COLORS = {
  primary: '#1a237e',
  darkGray: '#333333',
  mediumGray: '#666666',
  lightGray: '#eeeeee',
  borderGray: '#cccccc',
  white: '#ffffff',
  tableHeader: '#f5f5f5',
} as const;

const FONT_SIZES = {
  title: 20,
  subtitle: 14,
  body: 10,
  small: 9,
  tiny: 8,
} as const;

const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: FONT_SIZES.body,
    fontFamily: 'Helvetica',
    color: COLORS.darkGray,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    borderBottom: `2px solid ${COLORS.primary}`,
    paddingBottom: 15,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  companyLogo: {
    width: 60,
    height: 60,
    objectFit: 'contain',
  },
  companyName: {
    fontSize: FONT_SIZES.title,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
  },
  companyDate: {
    fontSize: FONT_SIZES.small,
    color: COLORS.mediumGray,
  },
  invoiceTitle: {
    fontSize: FONT_SIZES.title,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    textAlign: 'right',
  },

  // Invoice Details
  detailsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  detailsColumn: {
    width: '48%',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.subtitle,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    marginBottom: 8,
    borderBottom: `1px solid ${COLORS.lightGray}`,
    paddingBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  detailLabel: {
    fontFamily: 'Helvetica-Bold',
    width: 110,
    fontSize: FONT_SIZES.body,
  },
  detailValue: {
    fontSize: FONT_SIZES.body,
    color: COLORS.mediumGray,
  },

  // Bill To
  billToName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: FONT_SIZES.body,
    marginBottom: 2,
  },
  billToText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.mediumGray,
    marginBottom: 1,
  },

  // Load Details
  loadSection: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: COLORS.tableHeader,
    borderRadius: 4,
  },

  // Table
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableHeaderText: {
    color: COLORS.white,
    fontFamily: 'Helvetica-Bold',
    fontSize: FONT_SIZES.small,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottom: `1px solid ${COLORS.lightGray}`,
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottom: `1px solid ${COLORS.lightGray}`,
    backgroundColor: COLORS.tableHeader,
  },
  tableCell: {
    fontSize: FONT_SIZES.small,
  },
  colDescription: {
    width: '45%',
  },
  colQuantity: {
    width: '15%',
    textAlign: 'center',
  },
  colRate: {
    width: '20%',
    textAlign: 'right',
  },
  colAmount: {
    width: '20%',
    textAlign: 'right',
  },

  // Accessorials
  accessorialSection: {
    marginBottom: 20,
  },
  accessorialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderBottom: `1px solid ${COLORS.lightGray}`,
  },

  // Totals
  totalsSection: {
    alignItems: 'flex-end',
    marginBottom: 25,
  },
  totalsContainer: {
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  totalLabel: {
    fontSize: FONT_SIZES.body,
    color: COLORS.mediumGray,
  },
  totalValue: {
    fontSize: FONT_SIZES.body,
    textAlign: 'right',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderTop: `2px solid ${COLORS.primary}`,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: FONT_SIZES.subtitle,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
  },
  grandTotalValue: {
    fontSize: FONT_SIZES.subtitle,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    textAlign: 'right',
  },

  // Footer
  footer: {
    marginTop: 'auto',
    borderTop: `1px solid ${COLORS.borderGray}`,
    paddingTop: 15,
  },
  footerTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: FONT_SIZES.body,
    marginBottom: 5,
    color: COLORS.primary,
  },
  footerText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.mediumGray,
    marginBottom: 2,
  },
  notesSection: {
    marginTop: 10,
  },
});

export { pdfStyles, COLORS };
