import type { Agreement } from '@/agreements/types/agreementTypes';
import type { DocumentType, DocumentWithUploader } from '@/documents/types/documentTypes';
import { computeCompliancesForCarriers } from '../derivedComplianceBatch';

const NOW = new Date('2026-06-01T00:00:00.000Z');

const buildDoc = (overrides: Partial<DocumentWithUploader>): DocumentWithUploader =>
  ({
    id: 'd1',
    organizationId: 'org1',
    entityType: 'carrier',
    entityId: 'c1',
    type: 'INSURANCE_CERT',
    fileName: 'f',
    fileSize: 1,
    mimeType: 'application/pdf',
    s3Key: 's',
    url: 'u',
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

const buildAgreement = (overrides: Partial<Agreement>): Agreement =>
  ({
    id: 'a1',
    organizationId: 'org1',
    carrierId: 'c1',
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
  documentRepo: {
    findManyForCompliance: jest
      .fn<Promise<DocumentWithUploader[]>, [string[], DocumentType[]]>()
      .mockResolvedValue([]),
  },
  agreementRepo: {
    findManySigned: jest.fn<Promise<Agreement[]>, [string[]]>().mockResolvedValue([]),
  },
});

describe('computeCompliancesForCarriers', () => {
  it('issues zero queries and returns empty map when carrierIds is empty', async () => {
    const deps = buildDeps();

    const result = await computeCompliancesForCarriers([], deps, NOW);

    expect(result.size).toBe(0);
    expect(deps.documentRepo.findManyForCompliance).toHaveBeenCalledTimes(0);
    expect(deps.agreementRepo.findManySigned).toHaveBeenCalledTimes(0);
  });

  it('issues EXACTLY 2 queries for a single carrier', async () => {
    const deps = buildDeps();

    await computeCompliancesForCarriers(['c1'], deps, NOW);

    expect(deps.documentRepo.findManyForCompliance).toHaveBeenCalledTimes(1);
    expect(deps.agreementRepo.findManySigned).toHaveBeenCalledTimes(1);
    expect(deps.documentRepo.findManyForCompliance).toHaveBeenCalledWith(
      ['c1'],
      ['INSURANCE_CERT', 'W9', 'CARRIER_PACKET'],
    );
    expect(deps.agreementRepo.findManySigned).toHaveBeenCalledWith(['c1']);
  });

  it('issues EXACTLY 2 queries for 3 carriers (no N+1)', async () => {
    const deps = buildDeps();

    await computeCompliancesForCarriers(['c1', 'c2', 'c3'], deps, NOW);

    expect(deps.documentRepo.findManyForCompliance).toHaveBeenCalledTimes(1);
    expect(deps.agreementRepo.findManySigned).toHaveBeenCalledTimes(1);
  });

  it('builds full compliance per carrier from grouped query results', async () => {
    const expiresAt = new Date(NOW.getTime() + 60 * 24 * 60 * 60 * 1000);
    const deps = buildDeps();
    deps.documentRepo.findManyForCompliance.mockResolvedValue([
      buildDoc({ id: 'i1', entityId: 'c1', type: 'INSURANCE_CERT', expiresAt }),
      buildDoc({ id: 'w1', entityId: 'c1', type: 'W9' }),
      buildDoc({ id: 'p2', entityId: 'c2', type: 'CARRIER_PACKET' }),
    ]);
    deps.agreementRepo.findManySigned.mockResolvedValue([
      buildAgreement({
        id: 'agr-c1',
        carrierId: 'c1',
        signedAt: new Date('2026-05-10'),
      }),
    ]);

    const result = await computeCompliancesForCarriers(['c1', 'c2', 'c3'], deps, NOW);

    expect(result.size).toBe(3);

    const c1 = result.get('c1');
    expect(c1?.insurance).toEqual({ onFile: true, expiresAt, warning: null });
    expect(c1?.w9.onFile).toBe(true);
    expect(c1?.carrierPacket.onFile).toBe(false);
    expect(c1?.agreement.onFile).toBe(true);
    expect(c1?.agreement.signedAgreementId).toBe('agr-c1');

    const c2 = result.get('c2');
    expect(c2?.insurance.onFile).toBe(false);
    expect(c2?.w9.onFile).toBe(false);
    expect(c2?.carrierPacket.onFile).toBe(true);
    expect(c2?.agreement.onFile).toBe(false);

    const c3 = result.get('c3');
    expect(c3?.insurance.onFile).toBe(false);
    expect(c3?.w9.onFile).toBe(false);
    expect(c3?.carrierPacket.onFile).toBe(false);
    expect(c3?.agreement.onFile).toBe(false);
  });

  it('selects latest insurance per carrier by createdAt and derives warning bucket', async () => {
    const newerExpires = new Date(NOW.getTime() + 3 * 24 * 60 * 60 * 1000); // 7_DAY
    const olderExpires = new Date(NOW.getTime() + 100 * 24 * 60 * 60 * 1000);
    const deps = buildDeps();
    deps.documentRepo.findManyForCompliance.mockResolvedValue([
      buildDoc({
        id: 'old',
        entityId: 'c1',
        type: 'INSURANCE_CERT',
        createdAt: new Date('2026-01-01'),
        expiresAt: olderExpires,
      }),
      buildDoc({
        id: 'new',
        entityId: 'c1',
        type: 'INSURANCE_CERT',
        createdAt: new Date('2026-05-01'),
        expiresAt: newerExpires,
      }),
    ]);

    const result = await computeCompliancesForCarriers(['c1'], deps, NOW);

    expect(result.get('c1')?.insurance.expiresAt).toEqual(newerExpires);
    expect(result.get('c1')?.insurance.warning).toBe('7_DAY');
  });

  it('selects latest agreement per carrier by signedAt when multiple non-voided SIGNED rows exist', async () => {
    const older = new Date('2026-01-01');
    const newer = new Date('2026-05-01');
    const deps = buildDeps();
    deps.agreementRepo.findManySigned.mockResolvedValue([
      buildAgreement({ id: 'older', carrierId: 'c1', signedAt: older }),
      buildAgreement({ id: 'newer', carrierId: 'c1', signedAt: newer }),
    ]);

    const result = await computeCompliancesForCarriers(['c1'], deps, NOW);

    expect(result.get('c1')?.agreement.signedAgreementId).toBe('newer');
    expect(result.get('c1')?.agreement.signedAt).toEqual(newer);
  });
});
