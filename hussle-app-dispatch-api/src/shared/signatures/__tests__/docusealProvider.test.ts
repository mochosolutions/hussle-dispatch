import type { Logger } from '@/shared/utils/logger';

import { createDocusealProvider } from '../docusealProvider';
import type { CreateSubmissionInput } from '../types';

interface FakeResponseOptions {
  status: number;
  body?: unknown;
  binary?: Buffer;
}

const makeResponse = (opts: FakeResponseOptions): Response => {
  const { status, body, binary } = opts;
  const ok = status >= 200 && status < 300;
  const arrayBufferImpl = async (): Promise<ArrayBuffer> => {
    const buf = binary ?? Buffer.from('binary-data');
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  };
  const jsonImpl = async (): Promise<unknown> => body;
  const res: Partial<Response> = {
    ok,
    status,
    json: jsonImpl,
    arrayBuffer: arrayBufferImpl,
  };
  return res as Response;
};

const makeLogger = (): Logger => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

const baseInput: CreateSubmissionInput = {
  templateKey: 'DISPATCH_AGREEMENT',
  variables: { carrierName: 'Acme Trucking' },
  signer: { name: 'Jane Driver', email: 'jane@acme.test' },
  metadata: { html: '<html><body>Sign here</body></html>', agreementId: 'a1' },
};

const sampleCreateResponse = {
  id: 'sub_abc',
  status: 'pending',
  submitters: [
    { embed_src: 'https://docuseal/embed/xyz', email: 'jane@acme.test' },
  ],
  expire_at: '2026-06-01T00:00:00.000Z',
  documents: [{ url: 'https://docuseal/doc/abc.pdf' }],
  audit_log_url: 'https://docuseal/audit/abc.pdf',
};

const baseGetResponse = {
  id: 'sub_abc',
  submitters: [{ embed_src: 'https://docuseal/embed/xyz', email: 'jane@acme.test' }],
  expire_at: '2026-06-01T00:00:00.000Z',
  documents: [{ url: 'https://docuseal/doc/abc.pdf' }],
  audit_log_url: 'https://docuseal/audit/abc.pdf',
  completed_at: '2026-05-14T00:00:00.000Z',
  declined_at: '2026-05-14T00:00:00.000Z',
  expired_at: '2026-05-14T00:00:00.000Z',
};

describe('docusealProvider', () => {
  describe('factory', () => {
    it('throws when baseUrl is empty', () => {
      expect(() =>
        createDocusealProvider({
          baseUrl: '',
          apiKey: 'k',
          logger: makeLogger(),
        })
      ).toThrow(/DocuSeal config missing/);
    });

    it('throws when apiKey is empty', () => {
      expect(() =>
        createDocusealProvider({
          baseUrl: 'https://docuseal.test',
          apiKey: '',
          logger: makeLogger(),
        })
      ).toThrow(/DocuSeal config missing/);
    });
  });

  describe('createSubmission', () => {
    it('posts to {baseUrl}/api/submissions with X-Auth-Token header and JSON body', async () => {
      const fetch = jest.fn().mockResolvedValue(
        makeResponse({ status: 200, body: sampleCreateResponse })
      );
      const sleep = jest.fn().mockResolvedValue(undefined);
      const provider = createDocusealProvider({
        baseUrl: 'https://docuseal.test',
        apiKey: 'secret-key',
        fetch,
        sleep,
        logger: makeLogger(),
      });

      const ref = await provider.createSubmission(baseInput);

      expect(fetch).toHaveBeenCalledTimes(1);
      const [url, init] = fetch.mock.calls[0];
      expect(url).toBe('https://docuseal.test/api/submissions');
      expect(init.method).toBe('POST');
      expect(init.headers['X-Auth-Token']).toBe('secret-key');
      expect(init.headers['Content-Type']).toBe('application/json');
      const parsedBody = JSON.parse(init.body);
      expect(parsedBody.template_html).toBe('<html><body>Sign here</body></html>');
      expect(parsedBody.submitters).toEqual([
        { name: 'Jane Driver', email: 'jane@acme.test', role: 'First Party' },
      ]);
      expect(ref).toEqual({
        providerSubmissionId: 'sub_abc',
        embedUrl: 'https://docuseal/embed/xyz',
        expiresAt: new Date('2026-06-01T00:00:00.000Z'),
      });
    });

    it('retries on 502 twice then succeeds; sleep called with 1000, 5000', async () => {
      const fetch = jest
        .fn()
        .mockResolvedValueOnce(makeResponse({ status: 502 }))
        .mockResolvedValueOnce(makeResponse({ status: 502 }))
        .mockResolvedValueOnce(makeResponse({ status: 200, body: sampleCreateResponse }));
      const sleep = jest.fn().mockResolvedValue(undefined);
      const provider = createDocusealProvider({
        baseUrl: 'https://docuseal.test',
        apiKey: 'k',
        fetch,
        sleep,
        logger: makeLogger(),
      });

      const ref = await provider.createSubmission(baseInput);

      expect(ref.providerSubmissionId).toBe('sub_abc');
      expect(fetch).toHaveBeenCalledTimes(3);
      expect(sleep).toHaveBeenCalledTimes(2);
      expect(sleep).toHaveBeenNthCalledWith(1, 1_000);
      expect(sleep).toHaveBeenNthCalledWith(2, 5_000);
    });

    it('throws immediately on 400; sleep is not called', async () => {
      const fetch = jest.fn().mockResolvedValue(makeResponse({ status: 400 }));
      const sleep = jest.fn().mockResolvedValue(undefined);
      const provider = createDocusealProvider({
        baseUrl: 'https://docuseal.test',
        apiKey: 'k',
        fetch,
        sleep,
        logger: makeLogger(),
      });

      await expect(provider.createSubmission(baseInput)).rejects.toThrow(
        /status 400/
      );
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(sleep).not.toHaveBeenCalled();
    });

    it('throws when input.metadata.html is missing', async () => {
      const fetch = jest.fn();
      const provider = createDocusealProvider({
        baseUrl: 'https://docuseal.test',
        apiKey: 'k',
        fetch,
        sleep: jest.fn(),
        logger: makeLogger(),
      });

      const inputWithoutHtml: CreateSubmissionInput = {
        ...baseInput,
        metadata: { agreementId: 'a1' },
      };

      await expect(provider.createSubmission(inputWithoutHtml)).rejects.toThrow(
        /requires input.metadata.html/
      );
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('getSubmission', () => {
    const buildProvider = (response: Response) => {
      const fetch = jest.fn().mockResolvedValue(response);
      const provider = createDocusealProvider({
        baseUrl: 'https://docuseal.test',
        apiKey: 'k',
        fetch,
        sleep: jest.fn().mockResolvedValue(undefined),
        logger: makeLogger(),
      });
      return { provider, fetch };
    };

    it('maps "pending" to status: pending', async () => {
      const { provider } = buildProvider(
        makeResponse({ status: 200, body: { ...baseGetResponse, status: 'pending' } })
      );

      const status = await provider.getSubmission('sub_abc');

      expect(status.status).toBe('pending');
      expect(status.providerSubmissionId).toBe('sub_abc');
    });

    it('maps "completed" to status: signed with Date signedAt', async () => {
      const { provider } = buildProvider(
        makeResponse({ status: 200, body: { ...baseGetResponse, status: 'completed' } })
      );

      const status = await provider.getSubmission('sub_abc');

      expect(status.status).toBe('signed');
      if (status.status === 'signed') {
        expect(status.signedAt).toEqual(new Date('2026-05-14T00:00:00.000Z'));
      }
    });

    it('maps "declined" to status: declined with Date declinedAt', async () => {
      const { provider } = buildProvider(
        makeResponse({ status: 200, body: { ...baseGetResponse, status: 'declined' } })
      );

      const status = await provider.getSubmission('sub_abc');

      expect(status.status).toBe('declined');
      if (status.status === 'declined') {
        expect(status.declinedAt).toEqual(new Date('2026-05-14T00:00:00.000Z'));
      }
    });

    it('maps "expired" to status: expired with Date expiredAt', async () => {
      const { provider } = buildProvider(
        makeResponse({ status: 200, body: { ...baseGetResponse, status: 'expired' } })
      );

      const status = await provider.getSubmission('sub_abc');

      expect(status.status).toBe('expired');
      if (status.status === 'expired') {
        expect(status.expiredAt).toEqual(new Date('2026-05-14T00:00:00.000Z'));
      }
    });

    it('GETs {baseUrl}/api/submissions/{id} with X-Auth-Token header', async () => {
      const { provider, fetch } = buildProvider(
        makeResponse({ status: 200, body: { ...baseGetResponse, status: 'pending' } })
      );

      await provider.getSubmission('sub_abc');

      const [url, init] = fetch.mock.calls[0];
      expect(url).toBe('https://docuseal.test/api/submissions/sub_abc');
      expect(init.method).toBe('GET');
      expect(init.headers['X-Auth-Token']).toBe('k');
    });
  });

  describe('voidSubmission', () => {
    it('sends DELETE to {baseUrl}/api/submissions/{id}', async () => {
      const fetch = jest.fn().mockResolvedValue(makeResponse({ status: 204 }));
      const provider = createDocusealProvider({
        baseUrl: 'https://docuseal.test',
        apiKey: 'k',
        fetch,
        sleep: jest.fn().mockResolvedValue(undefined),
        logger: makeLogger(),
      });

      await provider.voidSubmission('sub_abc');

      expect(fetch).toHaveBeenCalledTimes(1);
      const [url, init] = fetch.mock.calls[0];
      expect(url).toBe('https://docuseal.test/api/submissions/sub_abc');
      expect(init.method).toBe('DELETE');
      expect(init.headers['X-Auth-Token']).toBe('k');
    });

    it('resolves when status is 404 (idempotent void)', async () => {
      const fetch = jest.fn().mockResolvedValue(makeResponse({ status: 404 }));
      const provider = createDocusealProvider({
        baseUrl: 'https://docuseal.test',
        apiKey: 'k',
        fetch,
        sleep: jest.fn().mockResolvedValue(undefined),
        logger: makeLogger(),
      });

      await expect(provider.voidSubmission('sub_abc')).resolves.toBeUndefined();
    });
  });

  describe('fetchSignedArtifacts', () => {
    it('fetches the document url and audit log url, returning two Buffers', async () => {
      const fetch = jest
        .fn()
        .mockResolvedValueOnce(
          makeResponse({ status: 200, body: { ...baseGetResponse, status: 'completed' } })
        )
        .mockResolvedValueOnce(
          makeResponse({ status: 200, binary: Buffer.from('PDF_BYTES') })
        )
        .mockResolvedValueOnce(
          makeResponse({ status: 200, binary: Buffer.from('AUDIT_BYTES') })
        );
      const provider = createDocusealProvider({
        baseUrl: 'https://docuseal.test',
        apiKey: 'k',
        fetch,
        sleep: jest.fn().mockResolvedValue(undefined),
        logger: makeLogger(),
      });

      const artifacts = await provider.fetchSignedArtifacts('sub_abc');

      expect(fetch).toHaveBeenCalledTimes(3);
      expect(fetch.mock.calls[1][0]).toBe('https://docuseal/doc/abc.pdf');
      expect(fetch.mock.calls[2][0]).toBe('https://docuseal/audit/abc.pdf');
      expect(Buffer.isBuffer(artifacts.signedPdf)).toBe(true);
      expect(Buffer.isBuffer(artifacts.auditCertificate)).toBe(true);
      expect(artifacts.signedPdf.toString()).toBe('PDF_BYTES');
      expect(artifacts.auditCertificate.toString()).toBe('AUDIT_BYTES');
    });
  });
});
