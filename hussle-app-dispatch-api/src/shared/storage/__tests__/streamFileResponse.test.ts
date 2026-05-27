import type { Response } from 'express';
import { streamFileResponse } from '../streamFileResponse';
import type { StorageProvider } from '../storageProvider';

const buildMockRes = (): jest.Mocked<Pick<Response, 'setHeader' | 'redirect'>> => ({
  setHeader: jest.fn(),
  redirect: jest.fn(),
});

const buildMockStorage = (
  url = 'https://signed.example/key',
): jest.Mocked<Pick<StorageProvider, 'getPresignedGetUrl'>> => ({
  getPresignedGetUrl: jest.fn().mockResolvedValue(url),
});

describe('streamFileResponse', () => {
  it('mints a presigned URL with attachment disposition by default and 302-redirects', async () => {
    const res = buildMockRes();
    const storageProvider = buildMockStorage('https://s3.example/invoices/foo.pdf?signed');

    await streamFileResponse({
      res: res as unknown as Response,
      storageProvider: storageProvider as unknown as StorageProvider,
      key: 'invoices/INV-0001.pdf',
    });

    expect(storageProvider.getPresignedGetUrl).toHaveBeenCalledWith(
      'invoices/INV-0001.pdf',
      undefined,
      undefined,
      'attachment',
    );
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
    expect(res.redirect).toHaveBeenCalledWith(302, 'https://s3.example/invoices/foo.pdf?signed');
  });

  it('passes through displayName, disposition, and expiresInSeconds', async () => {
    const res = buildMockRes();
    const storageProvider = buildMockStorage();

    await streamFileResponse({
      res: res as unknown as Response,
      storageProvider: storageProvider as unknown as StorageProvider,
      key: 'agreements/abc/signed.pdf',
      displayName: 'Signed_Agreement.pdf',
      disposition: 'inline',
      expiresInSeconds: 60,
    });

    expect(storageProvider.getPresignedGetUrl).toHaveBeenCalledWith(
      'agreements/abc/signed.pdf',
      60,
      'Signed_Agreement.pdf',
      'inline',
    );
  });
});
