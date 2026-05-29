import type { Request } from 'express';

import { ValidationError } from '@/shared/errors';

import {
  acceptMapper,
  importIdMapper,
  listImportsMapper,
  manualUploadMapper,
} from '../rateconImportMappers';

const ORG = 'org-1';

const makeReq = (overrides: Partial<Request> = {}): Request =>
  ({
    organizationId: ORG,
    params: {},
    query: {},
    body: {},
    ...overrides,
  }) as unknown as Request;

describe('listImportsMapper', () => {
  it('maps org scope only when no query filters are present', () => {
    expect(listImportsMapper(makeReq())).toEqual({ organizationId: ORG });
  });

  it('includes status and includeResolved when present', () => {
    const req = makeReq({ query: { status: 'PENDING_REVIEW', includeResolved: 'true' } });

    expect(listImportsMapper(req)).toEqual({
      organizationId: ORG,
      status: 'PENDING_REVIEW',
      includeResolved: true,
    });
  });

  it('omits includeResolved unless it is exactly "true"', () => {
    const req = makeReq({ query: { includeResolved: 'false' } });

    expect(listImportsMapper(req)).toEqual({ organizationId: ORG });
  });

  it('throws ValidationError when organization scope is missing', () => {
    expect(() => listImportsMapper(makeReq({ organizationId: undefined }))).toThrow(
      ValidationError,
    );
  });
});

describe('importIdMapper', () => {
  it('maps org and id from params', () => {
    expect(importIdMapper(makeReq({ params: { id: 'imp-9' } }))).toEqual({
      organizationId: ORG,
      importId: 'imp-9',
    });
  });

  it('throws ValidationError when id param is missing', () => {
    expect(() => importIdMapper(makeReq())).toThrow(ValidationError);
  });
});

describe('acceptMapper', () => {
  it('maps loadId from body and acceptedByUserId from the authenticated user', () => {
    const req = makeReq({
      params: { id: 'imp-9' },
      body: { loadId: 'load-7' },
      user: { userId: 'user-3' },
    } as Partial<Request>);

    expect(acceptMapper(req)).toEqual({
      organizationId: ORG,
      importId: 'imp-9',
      loadId: 'load-7',
      acceptedByUserId: 'user-3',
    });
  });

  it('omits acceptedByUserId when there is no authenticated user', () => {
    const req = makeReq({ params: { id: 'imp-9' }, body: { loadId: 'load-7' } });

    expect(acceptMapper(req)).toEqual({
      organizationId: ORG,
      importId: 'imp-9',
      loadId: 'load-7',
    });
  });
});

describe('manualUploadMapper', () => {
  const pdfFile = {
    buffer: Buffer.from('%PDF-1.4'),
    originalname: 'ratecon.pdf',
    mimetype: 'application/pdf',
  };

  it('maps a valid PDF upload to a MANUAL_UPLOAD create input', () => {
    const req = makeReq({ file: pdfFile } as Partial<Request>);

    expect(manualUploadMapper(req)).toEqual({
      organizationId: ORG,
      pdfBytes: pdfFile.buffer,
      fileName: 'ratecon.pdf',
      source: 'MANUAL_UPLOAD',
    });
  });

  it('throws ValidationError when no file is attached', () => {
    expect(() => manualUploadMapper(makeReq())).toThrow(ValidationError);
  });

  it('throws ValidationError when the uploaded file is not a PDF', () => {
    const req = makeReq({
      file: { ...pdfFile, mimetype: 'image/png' },
    } as Partial<Request>);

    expect(() => manualUploadMapper(req)).toThrow(ValidationError);
  });
});
