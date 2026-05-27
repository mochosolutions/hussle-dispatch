import { http, HttpResponse } from 'msw';
import type { Document } from 'features/documents/types';
import { BASE, defaultMeta } from '../mockUtils';
import { mockDocuments } from '../fixtures/documents';

let db: Document[] = [...mockDocuments];

export const documentHandlers = [
  // Presign — return a fake presigned URL
  http.post(`${BASE}/documents/presign`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const documentId = `doc-${Date.now()}`;
    return HttpResponse.json({
      data: {
        documentId,
        presignedUrl: `http://localhost:9999/fake-upload/${documentId}`,
        expiresIn: 3600,
      },
    });
  }),

  // Confirm document upload
  http.post(`${BASE}/documents/:id/confirm`, ({ params }) => {
    const doc = db.find((d) => d.id === params.id);
    if (doc) {
      return HttpResponse.json({ data: { ...doc, uploadStatus: 'CONFIRMED' } });
    }
    return HttpResponse.json({
      data: {
        id: params.id,
        uploadStatus: 'CONFIRMED',
        createdAt: new Date().toISOString(),
      },
    });
  }),

  // List documents
  http.get(`${BASE}/documents`, ({ request }) => {
    const url = new URL(request.url);
    const entityType = url.searchParams.get('entityType');
    const entityId = url.searchParams.get('entityId');

    let filtered = db;
    if (entityType) {
      filtered = filtered.filter((d) => d.entityType === entityType);
    }
    if (entityId) {
      filtered = filtered.filter((d) => d.entityId === entityId);
    }

    return HttpResponse.json({ data: filtered, meta: defaultMeta(filtered.length) });
  }),

  // Bulk download
  http.post(`${BASE}/documents/bulk-download`, async ({ request }) => {
    const { documentIds } = (await request.json()) as { documentIds: string[] };
    const downloads = documentIds.map((id) => ({
      documentId: id,
      fileName: `${id}.pdf`,
      presignedUrl: `http://localhost:9999/fake-download/${id}`,
    }));
    return HttpResponse.json({ data: { downloads, errors: [] } });
  }),

  // Catch fake S3 presigned URL uploads (raw fetch PUT)
  http.put('*/fake-upload/*', () => new HttpResponse(null, { status: 200 })),
];
