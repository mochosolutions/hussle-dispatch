import type { Agreement } from '@/agreements/types/agreementTypes';
import type { DocumentWithUploader } from '@/documents/types/documentTypes';
import {
  computeAgreementStatus,
  computeCarrierPacketStatus,
  computeInsuranceStatus,
  computeW9Status,
  deriveInsuranceWarning,
} from '../derivedCompliance';

const CARRIER_ID = 'c1';
const NOW = new Date('2026-06-01T00:00:00.000Z');

const buildDoc = (overrides: Partial<DocumentWithUploader> = {}): DocumentWithUploader =>
  ({
    id: 'd1',
    organizationId: 'org1',
    entityType: 'carrier',
    entityId: CARRIER_ID,
    type: 'INSURANCE_CERT',
    fileName: 'cert.pdf',
    fileSize: 1000,
    mimeType: 'application/pdf',
    s3Key: 's3://k',
    url: 'https://x',
    uploadStatus: 'confirmed',
    isArchived: false,
    uploadedByUserId: null,
    notes: null,
    expiresAt: null,
    metadata: null,
    reviewStatus: null,
    reviewedAt: null,
    reviewedByUserId: null,
    rejectionReason: null,
    signatureData: null,
    signedAt: null,
    createdAt: new Date('2026-05-01T00:00:00.000Z'),
    uploadedByUser: null,
    ...overrides,
  } as unknown as DocumentWithUploader);

const buildAgreement = (overrides: Partial<Agreement> = {}): Agreement =>
  ({
    id: 'a1',
    organizationId: 'org1',
    carrierId: CARRIER_ID,
    templateKey: 'DISPATCH_AGREEMENT',
    status: 'SIGNED',
    providerName: 'docuseal',
    providerSubmissionId: 'ps1',
    embedUrl: null,
    embedUrlExpiresAt: null,
    signerName: null,
    signerEmail: null,
    variables: {},
    signedAt: new Date('2026-05-01T00:00:00.000Z'),
    declinedAt: null,
    expiredAt: null,
    voidedAt: null,
    voidedByUserId: null,
    voidReason: null,
    signedPdfS3Key: null,
    auditCertificateS3Key: null,
    signedPdfSha256: null,
    createdByUserId: null,
    createdAt: new Date('2026-05-01T00:00:00.000Z'),
    updatedAt: new Date('2026-05-01T00:00:00.000Z'),
    ...overrides,
  } as unknown as Agreement);

const buildDeps = () => ({
  documentRepo: { findManyForCompliance: jest.fn() },
  agreementRepo: { findManySigned: jest.fn() },
});

describe('deriveInsuranceWarning', () => {
  it('returns null when expiresAt is null', () => {
    expect(deriveInsuranceWarning(null, NOW)).toBeNull();
  });

  it("returns 'EXPIRED' when expiresAt is before now", () => {
    const expired = new Date(NOW.getTime() - 1000);
    expect(deriveInsuranceWarning(expired, NOW)).toBe('EXPIRED');
  });

  it("returns '7_DAY' when expiresAt is within 7 days", () => {
    const within7 = new Date(NOW.getTime() + 3 * 24 * 60 * 60 * 1000);
    expect(deriveInsuranceWarning(within7, NOW)).toBe('7_DAY');
  });

  it("returns '30_DAY' when expiresAt is within 30 days but outside 7 days", () => {
    const within30 = new Date(NOW.getTime() + 20 * 24 * 60 * 60 * 1000);
    expect(deriveInsuranceWarning(within30, NOW)).toBe('30_DAY');
  });

  it('returns null when expiresAt is more than 30 days out', () => {
    const later = new Date(NOW.getTime() + 60 * 24 * 60 * 60 * 1000);
    expect(deriveInsuranceWarning(later, NOW)).toBeNull();
  });
});

describe('computeInsuranceStatus', () => {
  it('returns onFile=true with expiresAt and warning when a confirmed non-archived cert exists', async () => {
    const expiresAt = new Date(NOW.getTime() + 60 * 24 * 60 * 60 * 1000);
    const deps = buildDeps();
    deps.documentRepo.findManyForCompliance.mockResolvedValue([buildDoc({ expiresAt })]);

    const result = await computeInsuranceStatus(CARRIER_ID, deps, NOW);

    expect(result).toEqual({ onFile: true, expiresAt, warning: null });
    expect(deps.documentRepo.findManyForCompliance).toHaveBeenCalledWith(
      [CARRIER_ID],
      ['INSURANCE_CERT'],
    );
  });

  it('returns onFile=false when no docs exist (all-archived → repo returns empty)', async () => {
    const deps = buildDeps();
    deps.documentRepo.findManyForCompliance.mockResolvedValue([]);

    const result = await computeInsuranceStatus(CARRIER_ID, deps, NOW);

    expect(result).toEqual({ onFile: false, expiresAt: null, warning: null });
  });

  it('selects the latest document by createdAt when multiple exist', async () => {
    const olderExpires = new Date(NOW.getTime() + 100 * 24 * 60 * 60 * 1000);
    const newerExpires = new Date(NOW.getTime() + 10 * 24 * 60 * 60 * 1000); // 30_DAY
    const deps = buildDeps();
    deps.documentRepo.findManyForCompliance.mockResolvedValue([
      buildDoc({ id: 'old', createdAt: new Date('2026-01-01'), expiresAt: olderExpires }),
      buildDoc({ id: 'new', createdAt: new Date('2026-05-01'), expiresAt: newerExpires }),
    ]);

    const result = await computeInsuranceStatus(CARRIER_ID, deps, NOW);

    expect(result.expiresAt).toEqual(newerExpires);
    expect(result.warning).toBe('30_DAY');
  });

  it("returns warning='EXPIRED' when latest doc expiresAt < now", async () => {
    const deps = buildDeps();
    deps.documentRepo.findManyForCompliance.mockResolvedValue([
      buildDoc({ expiresAt: new Date(NOW.getTime() - 1000) }),
    ]);

    const result = await computeInsuranceStatus(CARRIER_ID, deps, NOW);
    expect(result.warning).toBe('EXPIRED');
  });

  it("returns warning='7_DAY' when expiresAt within next 7 days", async () => {
    const deps = buildDeps();
    deps.documentRepo.findManyForCompliance.mockResolvedValue([
      buildDoc({ expiresAt: new Date(NOW.getTime() + 2 * 24 * 60 * 60 * 1000) }),
    ]);

    const result = await computeInsuranceStatus(CARRIER_ID, deps, NOW);
    expect(result.warning).toBe('7_DAY');
  });

  it("returns warning=null when expiresAt is null on the latest doc", async () => {
    const deps = buildDeps();
    deps.documentRepo.findManyForCompliance.mockResolvedValue([buildDoc({ expiresAt: null })]);

    const result = await computeInsuranceStatus(CARRIER_ID, deps, NOW);
    expect(result).toEqual({ onFile: true, expiresAt: null, warning: null });
  });
});

describe('computeW9Status', () => {
  it('returns onFile=true when at least one W9 row exists', async () => {
    const deps = buildDeps();
    deps.documentRepo.findManyForCompliance.mockResolvedValue([buildDoc({ type: 'W9' })]);

    const result = await computeW9Status(CARRIER_ID, deps);
    expect(result.onFile).toBe(true);
    expect(deps.documentRepo.findManyForCompliance).toHaveBeenCalledWith([CARRIER_ID], ['W9']);
  });

  it('returns onFile=false when no W9 rows exist', async () => {
    const deps = buildDeps();
    deps.documentRepo.findManyForCompliance.mockResolvedValue([]);

    const result = await computeW9Status(CARRIER_ID, deps);
    expect(result.onFile).toBe(false);
  });
});

describe('computeCarrierPacketStatus', () => {
  it('returns onFile=true when a packet exists', async () => {
    const deps = buildDeps();
    deps.documentRepo.findManyForCompliance.mockResolvedValue([
      buildDoc({ type: 'CARRIER_PACKET' }),
    ]);

    const result = await computeCarrierPacketStatus(CARRIER_ID, deps);
    expect(result.onFile).toBe(true);
  });

  it('returns onFile=false when missing', async () => {
    const deps = buildDeps();
    deps.documentRepo.findManyForCompliance.mockResolvedValue([]);

    const result = await computeCarrierPacketStatus(CARRIER_ID, deps);
    expect(result.onFile).toBe(false);
  });
});

describe('computeAgreementStatus', () => {
  it('returns onFile=true with signedAgreementId and signedAt for SIGNED + voidedAt=null', async () => {
    const signedAt = new Date('2026-05-15T00:00:00.000Z');
    const deps = buildDeps();
    deps.agreementRepo.findManySigned.mockResolvedValue([buildAgreement({ id: 'a1', signedAt })]);

    const result = await computeAgreementStatus(CARRIER_ID, deps);

    expect(result).toEqual({ onFile: true, signedAgreementId: 'a1', signedAt });
    expect(deps.agreementRepo.findManySigned).toHaveBeenCalledWith([CARRIER_ID]);
  });

  it('returns onFile=false when no SIGNED + voidedAt=null agreements (repo filters them out)', async () => {
    const deps = buildDeps();
    deps.agreementRepo.findManySigned.mockResolvedValue([]);

    const result = await computeAgreementStatus(CARRIER_ID, deps);
    expect(result).toEqual({ onFile: false, signedAgreementId: null, signedAt: null });
  });

  it('selects latest by signedAt DESC when multiple SIGNED + voidedAt=null rows exist', async () => {
    const older = new Date('2026-01-01T00:00:00.000Z');
    const newer = new Date('2026-05-01T00:00:00.000Z');
    const deps = buildDeps();
    deps.agreementRepo.findManySigned.mockResolvedValue([
      buildAgreement({ id: 'older', signedAt: older }),
      buildAgreement({ id: 'newer', signedAt: newer }),
    ]);

    const result = await computeAgreementStatus(CARRIER_ID, deps);
    expect(result.signedAgreementId).toBe('newer');
    expect(result.signedAt).toEqual(newer);
  });
});
