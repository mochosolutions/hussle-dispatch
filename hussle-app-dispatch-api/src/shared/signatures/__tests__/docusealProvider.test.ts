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
  variables: {
    carrier_legal_name: 'Acme Trucking',
    mc_number: 'MC123456',
    dot_number: 'DOT789012',
    dispatcher_org_name: 'Mocho Solutions',
    effective_date: '2026-05-15',
  },
  signer: { name: 'Jane Driver', email: 'jane@acme.test' },
  metadata: { agreementId: 'a1' },
};

const sampleCreateResponse = [
  {
    submission_id: 42,
    slug: 'abc123',
    uuid: 'uuid-1',
    name: 'Jane Driver',
    email: 'jane@acme.test',
    status: 'awaiting',
    embed_src: 'http://localhost:3030/s/abc123',
    completed_at: null,
  },
];

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
          templateId: 1,
          logger: makeLogger(),
        })
      ).toThrow(/DocuSeal config missing/);
    });

    it('throws when apiKey is empty', () => {
      expect(() =>
        createDocusealProvider({
          baseUrl: 'https://docuseal.test',
          apiKey: '',
          templateId: 1,
          logger: makeLogger(),
        })
      ).toThrow(/DocuSeal config missing/);
    });
  });

  describe('createSubmission', () => {
    it('posts template_id + submitters[].values to {baseUrl}/api/submissions with X-Auth-Token header', async () => {
      const fetch = jest.fn().mockResolvedValue(
        makeResponse({ status: 200, body: sampleCreateResponse })
      );
      const sleep = jest.fn().mockResolvedValue(undefined);
      const provider = createDocusealProvider({
        baseUrl: 'https://docuseal.test',
        apiKey: 'secret-key',
        templateId: 7,
        fetch,
        sleep,
        logger: makeLogger(),
      });

      await provider.createSubmission(baseInput);

      expect(fetch).toHaveBeenCalledTimes(1);
      const [url, init] = fetch.mock.calls[0];
      expect(url).toBe('https://docuseal.test/api/submissions');
      expect(init.method).toBe('POST');
      expect(init.headers['X-Auth-Token']).toBe('secret-key');
      expect(init.headers['Content-Type']).toBe('application/json');
      const parsedBody = JSON.parse(init.body);
      expect(parsedBody.template_id).toBe(7);
      expect(parsedBody.template_html).toBeUndefined();
      expect(parsedBody.send_email).toBe(false);
      expect(parsedBody.submitters).toHaveLength(1);
      expect(parsedBody.submitters[0].name).toBe('Jane Driver');
      expect(parsedBody.submitters[0].email).toBe('jane@acme.test');
      expect(parsedBody.submitters[0].role).toBe('Carrier');
      expect(parsedBody.submitters[0].values).toEqual(baseInput.variables);
    });

    it('parses embed_src and submission_id from top-level array response', async () => {
      // Arrange
      const fetch = jest.fn().mockResolvedValue(
        makeResponse({ status: 200, body: sampleCreateResponse })
      );
      const provider = createDocusealProvider({
        baseUrl: 'https://docuseal.test',
        apiKey: 'k',
        templateId: 1,
        fetch,
        sleep: jest.fn().mockResolvedValue(undefined),
        logger: makeLogger(),
      });
      const before = Date.now();

      // Act
      const ref = await provider.createSubmission(baseInput);

      // Assert
      expect(ref.providerSubmissionId).toBe('42');
      expect(ref.embedUrl).toBe('http://localhost:3030/s/abc123');
      const expectedExpiry = before + 24 * 60 * 60 * 1000;
      expect(ref.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedExpiry - 1_000);
      expect(ref.expiresAt.getTime()).toBeLessThanOrEqual(expectedExpiry + 5_000);
    });

    it('throws before HTTP call when templateId is 0', async () => {
      const fetch = jest.fn();
      const provider = createDocusealProvider({
        baseUrl: 'https://docuseal.test',
        apiKey: 'k',
        templateId: 0,
        fetch,
        sleep: jest.fn().mockResolvedValue(undefined),
        logger: makeLogger(),
      });

      await expect(provider.createSubmission(baseInput)).rejects.toThrow(
        /DOCUSEAL_DISPATCH_TEMPLATE_ID env var is required/
      );
      expect(fetch).not.toHaveBeenCalled();
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
        templateId: 1,
        fetch,
        sleep,
        logger: makeLogger(),
      });

      const ref = await provider.createSubmission(baseInput);

      expect(ref.providerSubmissionId).toBe('42');
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
        templateId: 1,
        fetch,
        sleep,
        logger: makeLogger(),
      });

      await expect(provider.createSubmission(baseInput)).rejects.toThrow(/status 400/);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(sleep).not.toHaveBeenCalled();
    });
  });

  describe('getSubmission', () => {
    const buildProvider = (response: Response) => {
      const fetch = jest.fn().mockResolvedValue(response);
      const provider = createDocusealProvider({
        baseUrl: 'https://docuseal.test',
        apiKey: 'k',
        templateId: 1,
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
        templateId: 1,
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
        templateId: 1,
        fetch,
        sleep: jest.fn().mockResolvedValue(undefined),
        logger: makeLogger(),
      });

      await expect(provider.voidSubmission('sub_abc')).resolves.toBeUndefined();
    });
  });

  describe('refreshEmbedUrl', () => {
    it('GETs {baseUrl}/api/submissions/{id}, returns SubmissionRef from submitters[0].embed_src with future expiresAt', async () => {
      const fetch = jest.fn().mockResolvedValue(
        makeResponse({ status: 200, body: { ...baseGetResponse, status: 'pending' } })
      );
      const provider = createDocusealProvider({
        baseUrl: 'https://docuseal.test',
        apiKey: 'k',
        templateId: 1,
        fetch,
        sleep: jest.fn().mockResolvedValue(undefined),
        logger: makeLogger(),
      });

      const before = Date.now();
      const refreshed = await provider.refreshEmbedUrl('sub_abc');

      expect(fetch).toHaveBeenCalledTimes(1);
      const [url, init] = fetch.mock.calls[0];
      expect(url).toBe('https://docuseal.test/api/submissions/sub_abc');
      expect(init.method).toBe('GET');
      expect(init.headers['X-Auth-Token']).toBe('k');
      expect(refreshed.providerSubmissionId).toBe('sub_abc');
      expect(refreshed.embedUrl).toBe('https://docuseal/embed/xyz');
      expect(refreshed.expiresAt.getTime()).toBeGreaterThanOrEqual(before);
    });

    it('throws when submitters array is empty', async () => {
      const fetch = jest.fn().mockResolvedValue(
        makeResponse({
          status: 200,
          body: { ...baseGetResponse, status: 'pending', submitters: [] },
        })
      );
      const provider = createDocusealProvider({
        baseUrl: 'https://docuseal.test',
        apiKey: 'k',
        templateId: 1,
        fetch,
        sleep: jest.fn().mockResolvedValue(undefined),
        logger: makeLogger(),
      });

      await expect(provider.refreshEmbedUrl('sub_abc')).rejects.toThrow(/no submitters/);
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
        templateId: 1,
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
