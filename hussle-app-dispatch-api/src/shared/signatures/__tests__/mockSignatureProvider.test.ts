import { createMockSignatureProvider } from '../mockSignatureProvider';
import type { CreateSubmissionInput } from '../types';

const baseInput: CreateSubmissionInput = {
  templateKey: 'DISPATCH_AGREEMENT',
  variables: { carrierName: 'Acme Trucking' },
  signer: { name: 'Jane Driver', email: 'jane@acme.test' },
  metadata: { agreementId: 'agreement-1' },
};

const withEmail = (email: string): CreateSubmissionInput => ({
  ...baseInput,
  signer: { ...baseInput.signer, email },
});

describe('mockSignatureProvider', () => {
  describe('createSubmission', () => {
    it('returns identical providerSubmissionId when called twice with identical input', async () => {
      const provider = createMockSignatureProvider();

      const first = await provider.createSubmission(baseInput);
      const second = await provider.createSubmission(baseInput);

      expect(first.providerSubmissionId).toBe(second.providerSubmissionId);
    });

    it('throws an Error matching /timeout/i when signer.email contains TIMEOUT@', async () => {
      const provider = createMockSignatureProvider();

      await expect(
        provider.createSubmission(withEmail('TIMEOUT@example.com'))
      ).rejects.toThrow(/timeout/i);
    });

    it('throws an Error matching /rate_limit/i when signer.email contains RATELIMIT@', async () => {
      const provider = createMockSignatureProvider();

      await expect(
        provider.createSubmission(withEmail('RATELIMIT@example.com'))
      ).rejects.toThrow(/rate_limit/i);
    });

    it('returns an embedUrl shaped /dev/sign/{providerSubmissionId}', async () => {
      const provider = createMockSignatureProvider();

      const ref = await provider.createSubmission(baseInput);

      expect(ref.embedUrl).toBe(`/dev/sign/${ref.providerSubmissionId}`);
    });

    it('returns expiresAt 24h after createdAt', async () => {
      const provider = createMockSignatureProvider();
      const before = Date.now();

      const ref = await provider.createSubmission(baseInput);

      const dayMs = 24 * 60 * 60 * 1000;
      expect(ref.expiresAt.getTime()).toBeGreaterThanOrEqual(before + dayMs - 1000);
      expect(ref.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + dayMs + 1000);
    });
  });

  describe('getSubmission', () => {
    it('throws when providerSubmissionId is the literal NOTFOUND', async () => {
      const provider = createMockSignatureProvider();

      await expect(provider.getSubmission('NOTFOUND')).rejects.toThrow();
    });

    it('throws when the submission has not been created', async () => {
      const provider = createMockSignatureProvider();

      await expect(provider.getSubmission('mock_unknown')).rejects.toThrow();
    });

    it('returns status: "pending" for a freshly created submission', async () => {
      const provider = createMockSignatureProvider();
      const ref = await provider.createSubmission(baseInput);

      const status = await provider.getSubmission(ref.providerSubmissionId);

      expect(status.status).toBe('pending');
      expect(status.providerSubmissionId).toBe(ref.providerSubmissionId);
    });

    it('returns status: "signed" with Date signedAt after markSigned helper', async () => {
      const provider = createMockSignatureProvider();
      const ref = await provider.createSubmission(baseInput);

      provider.__testHelpers.markSigned(ref.providerSubmissionId);
      const status = await provider.getSubmission(ref.providerSubmissionId);

      expect(status.status).toBe('signed');
      if (status.status === 'signed') {
        expect(status.signedAt).toBeInstanceOf(Date);
      }
    });

    it('returns status: "declined" with Date declinedAt for DECLINE@ signer', async () => {
      const provider = createMockSignatureProvider();
      const ref = await provider.createSubmission(withEmail('DECLINE@example.com'));

      const status = await provider.getSubmission(ref.providerSubmissionId);

      expect(status.status).toBe('declined');
      if (status.status === 'declined') {
        expect(status.declinedAt).toBeInstanceOf(Date);
      }
    });
  });

  describe('voidSubmission', () => {
    it('marks state as voided and getSubmission returns voided with Date voidedAt', async () => {
      const provider = createMockSignatureProvider();
      const ref = await provider.createSubmission(baseInput);

      await provider.voidSubmission(ref.providerSubmissionId);
      const status = await provider.getSubmission(ref.providerSubmissionId);

      expect(status.status).toBe('voided');
      if (status.status === 'voided') {
        expect(status.voidedAt).toBeInstanceOf(Date);
      }
    });
  });

  describe('fetchSignedArtifacts', () => {
    it('returns two non-empty Buffers', async () => {
      const provider = createMockSignatureProvider();
      const ref = await provider.createSubmission(baseInput);

      const artifacts = await provider.fetchSignedArtifacts(ref.providerSubmissionId);

      expect(Buffer.isBuffer(artifacts.signedPdf)).toBe(true);
      expect(Buffer.isBuffer(artifacts.auditCertificate)).toBe(true);
      expect(artifacts.signedPdf.length).toBeGreaterThan(0);
      expect(artifacts.auditCertificate.length).toBeGreaterThan(0);
    });
  });

  describe('reset helper', () => {
    it('clears all state', async () => {
      const provider = createMockSignatureProvider();
      const ref = await provider.createSubmission(baseInput);

      provider.__testHelpers.reset();

      await expect(provider.getSubmission(ref.providerSubmissionId)).rejects.toThrow();
    });
  });
});
