import { createMockSignatureProvider } from '../mockSignatureProvider';
import type { SignatureProviderPort } from '../signatureProviderPort';
import type { CreateSubmissionInput } from '../types';

// Reusable contract test for any SignatureProviderPort implementation. Future
// providers (e.g. docusealProvider against a sandbox) can plug into this by
// registering a new describe block via `runSignatureProviderContract`.

interface ContractProviderHandle {
  port: SignatureProviderPort;
  markSigned?: (providerSubmissionId: string) => void;
}

export const runSignatureProviderContract = (
  makeProvider: () => SignatureProviderPort | ContractProviderHandle,
  name: string
): void => {
  describe(`SignatureProviderPort contract (${name})`, () => {
    const normalize = (
      provider: SignatureProviderPort | ContractProviderHandle
    ): ContractProviderHandle =>
      'port' in provider ? provider : { port: provider };

    const baseInput: CreateSubmissionInput = {
      templateKey: 'DISPATCH_AGREEMENT',
      variables: { carrierName: 'Contract Co' },
      signer: { name: 'Test Signer', email: 'contract@test.example' },
      metadata: { agreementId: 'contract-1' },
    };

    it('createSubmission returns a SubmissionRef with truthy fields and Date expiresAt', async () => {
      const handle = normalize(makeProvider());

      const ref = await handle.port.createSubmission(baseInput);

      expect(ref.providerSubmissionId).toBeTruthy();
      expect(ref.embedUrl).toBeTruthy();
      expect(ref.expiresAt).toBeInstanceOf(Date);
    });

    it('getSubmission immediately after createSubmission narrows to a discriminated union member', async () => {
      const handle = normalize(makeProvider());
      const ref = await handle.port.createSubmission(baseInput);

      const status = await handle.port.getSubmission(ref.providerSubmissionId);

      expect(['pending', 'signed', 'declined', 'voided', 'expired']).toContain(status.status);
      if (status.status === 'pending') {
        expect(status.providerSubmissionId).toBe(ref.providerSubmissionId);
      }
    });

    it('voidSubmission resolves without throwing', async () => {
      const handle = normalize(makeProvider());
      const ref = await handle.port.createSubmission(baseInput);

      await expect(handle.port.voidSubmission(ref.providerSubmissionId)).resolves.toBeUndefined();
    });

    it('refreshEmbedUrl returns a SubmissionRef with same providerSubmissionId and a future expiresAt', async () => {
      const handle = normalize(makeProvider());
      const ref = await handle.port.createSubmission(baseInput);

      const refreshed = await handle.port.refreshEmbedUrl(ref.providerSubmissionId);

      expect(refreshed.providerSubmissionId).toBe(ref.providerSubmissionId);
      expect(refreshed.embedUrl).toBeTruthy();
      expect(refreshed.expiresAt).toBeInstanceOf(Date);
      expect(refreshed.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('markSigned + getSubmission narrows to signed; fetchSignedArtifacts returns Buffers', async () => {
      const handle = normalize(makeProvider());
      if (handle.markSigned === undefined) {
        return;
      }

      const ref = await handle.port.createSubmission(baseInput);
      handle.markSigned(ref.providerSubmissionId);

      const status = await handle.port.getSubmission(ref.providerSubmissionId);
      expect(status.status).toBe('signed');
      if (status.status === 'signed') {
        expect(status.signedAt).toBeInstanceOf(Date);
      }

      const artifacts = await handle.port.fetchSignedArtifacts(ref.providerSubmissionId);
      expect(Buffer.isBuffer(artifacts.signedPdf)).toBe(true);
      expect(Buffer.isBuffer(artifacts.auditCertificate)).toBe(true);
    });
  });
};

runSignatureProviderContract(() => {
  const provider = createMockSignatureProvider();
  return {
    port: provider,
    markSigned: (id: string) => {
      provider.__testHelpers.markSigned(id);
    },
  };
}, 'mock');
