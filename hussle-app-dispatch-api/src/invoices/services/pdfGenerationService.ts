import type { Logger } from '../../shared/utils/logger';
import type { BrowserPool } from '../../shared/providers/puppeteerBrowserPool';
import type { InvoiceTemplateData, PdfGenerationPort } from '../types/invoiceTemplateTypes';
import { invoiceTemplateStyles } from '../templates/invoiceTemplateStyles';

interface PdfGenerationServiceDeps {
  browserPool: BrowserPool;
  logger: Logger;
}

const renderTemplateToHtml = async (data: InvoiceTemplateData): Promise<string> => {
  const React = await import('react');
  const ReactDOMServer = await import('react-dom/server');
  const { InvoicePdfTemplate } = await import('../templates/InvoicePdfTemplate');

  const element = React.createElement(InvoicePdfTemplate, { data });
  const body = ReactDOMServer.renderToStaticMarkup(element);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>${invoiceTemplateStyles}</style>
</head>
<body>${body}</body>
</html>`;
};

export const createPdfGenerationService = (
  deps: PdfGenerationServiceDeps,
): PdfGenerationPort => ({
  generateInvoicePdf: async (data: InvoiceTemplateData): Promise<Buffer> => {
    const html = await renderTemplateToHtml(data);
    const page = await deps.browserPool.getPage();

    try {
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      const pdfBuffer = await page.pdf({
        format: 'Letter',
        margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
        printBackground: true,
      });

      deps.logger.info('PDF generated successfully', { invoiceNumber: data.invoiceNumber });
      return Buffer.from(pdfBuffer);
    } finally {
      await deps.browserPool.releasePage(page);
    }
  },
});
