import type { Logger } from '../../shared/utils/logger';
import type { BrowserPool } from '../../shared/providers/puppeteerBrowserPool';
import type { SettlementTemplateData } from '../templates/SettlementPdfTemplate';

export interface SettlementPdfGenerationPort {
  generateSettlementPdf: (data: SettlementTemplateData) => Promise<Buffer>;
}

interface SettlementPdfGenerationDeps {
  browserPool: BrowserPool;
  logger: Logger;
}

const renderTemplateToHtml = async (data: SettlementTemplateData): Promise<string> => {
  const React = await import('react');
  const ReactDOMServer = await import('react-dom/server');
  const { SettlementPdfTemplate } = await import('../templates/SettlementPdfTemplate');
  const { settlementStyles } = await import('../templates/settlementTemplateStyles');

  const element = React.createElement(SettlementPdfTemplate, { data });
  const body = ReactDOMServer.renderToStaticMarkup(element);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>${settlementStyles}</style>
</head>
<body>${body}</body>
</html>`;
};

export const createSettlementPdfGenerationService = (
  deps: SettlementPdfGenerationDeps,
): SettlementPdfGenerationPort => ({
  generateSettlementPdf: async (data: SettlementTemplateData): Promise<Buffer> => {
    const html = await renderTemplateToHtml(data);
    const page = await deps.browserPool.getPage();

    try {
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      const pdfBuffer = await page.pdf({
        format: 'Letter',
        margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
        printBackground: true,
      });

      deps.logger.info('Settlement PDF generated', {
        settlementNumber: data.settlementNumber,
      });
      return Buffer.from(pdfBuffer);
    } finally {
      await deps.browserPool.releasePage(page);
    }
  },
});
