import type { Logger } from '../utils/logger';

// ---------------------------------------------------------------------------
// Puppeteer browser pool — lazy-loaded to avoid import errors when
// puppeteer is not installed (e.g., in test environments)
// ---------------------------------------------------------------------------

interface BrowserPool {
  getPage(): Promise<PuppeteerPage>;
  releasePage(page: PuppeteerPage): Promise<void>;
  shutdown(): Promise<void>;
}

interface PuppeteerPage {
  setContent(html: string, options?: { waitUntil?: string }): Promise<void>;
  pdf(options?: Record<string, unknown>): Promise<Buffer>;
  close(): Promise<void>;
}

interface BrowserPoolConfig {
  maxPages: number;
  logger: Logger;
}

export const createBrowserPool = ({ maxPages, logger }: BrowserPoolConfig): BrowserPool => {
  let browserPromise: Promise<unknown> | null = null;
  let activePages = 0;
  const waitQueue: Array<(value: void) => void> = [];

  const getBrowser = async (): Promise<unknown> => {
    if (browserPromise === null) {
      browserPromise = launchBrowser(logger);
    }

    const browser = await browserPromise;
    const connected = await isBrowserConnected(browser);

    if (!connected) {
      logger.warn('Browser disconnected, relaunching');
      browserPromise = launchBrowser(logger);
      return browserPromise;
    }

    return browser;
  };

  const launchBrowser = async (log: Logger): Promise<unknown> => {
    const puppeteer = await import('puppeteer');
    const executablePath = process.env['PUPPETEER_EXECUTABLE_PATH'] ?? undefined;
    const browser = await puppeteer.default.launch({
      headless: true,
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    log.info('Puppeteer browser launched', { executablePath: executablePath ?? 'bundled' });
    return browser;
  };

  const isBrowserConnected = async (browser: unknown): Promise<boolean> => {
    try {
      const b = browser as { connected?: boolean };
      return b.connected === true;
    } catch {
      return false;
    }
  };

  const waitForSlot = (): Promise<void> => {
    if (activePages < maxPages) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      waitQueue.push(resolve);
    });
  };

  const releaseSlot = (): void => {
    const next = waitQueue.shift();
    if (next !== undefined) {
      next();
    }
  };

  return {
    getPage: async (): Promise<PuppeteerPage> => {
      await waitForSlot();
      activePages += 1;

      const browser = await getBrowser();
      const b = browser as { newPage(): Promise<PuppeteerPage> };
      const page = await b.newPage();

      return page;
    },

    releasePage: async (page: PuppeteerPage): Promise<void> => {
      try {
        await page.close();
      } catch (error: unknown) {
        logger.warn('Failed to close page', {
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        activePages -= 1;
        releaseSlot();
      }
    },

    shutdown: async (): Promise<void> => {
      if (browserPromise !== null) {
        try {
          const browser = await browserPromise;
          const b = browser as { close(): Promise<void> };
          await b.close();
        } catch (error: unknown) {
          logger.warn('Failed to close browser', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
        browserPromise = null;
      }
      logger.info('Browser pool shut down');
    },
  };
};

export type { BrowserPool, PuppeteerPage };
