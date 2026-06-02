import type { Request, Response } from 'express';
import type { LoadStatus, DocumentType } from '@prisma/client';
import type { DocumentService } from '../../documents/types/documentServiceTypes';
import type { DocumentWithUploader } from '../../documents/types/documentTypes';
import type { DriverPortalService } from '../services/driverPortalService';
import type { DriverPortalLoadSummary } from '../types/driverPortalTypes';
import type { DriverCheckCallRecord } from '../repositories/driverPortalCheckCallRepositoryPrisma';
import { computeCommoditySummary } from '@/shared/utils/computeCommoditySummary';
import { sendSingle } from '@/shared/responseEnvelope';
import { UnauthorizedError, ValidationError } from '@/shared/errors';

interface DriverPortalControllerDeps {
  driverPortalService: DriverPortalService;
  documentService: DocumentService;
}

// FIXME: Driver-uploadable document types are hard-coded. Move to org-level
// config (or a shared documents-policy module) so dispatchers can extend the
// allow-list without a code change. Deferred to post-MVP.
const DRIVER_DOCUMENT_TYPES: readonly DocumentType[] = [
  'BOL_SIGNED',
  'POD',
  'LUMPER_RECEIPT',
  'SCALE_TICKET',
  'FUEL_RECEIPT',
  'OTHER',
] as const;

export interface DriverPortalControllers {
  listLoads: (req: Request, res: Response) => Promise<void>;
  getLoadSummary: (req: Request, res: Response) => Promise<void>;
  advanceStatus: (req: Request, res: Response) => Promise<void>;
  checkIn: (req: Request, res: Response) => Promise<void>;
  presignDocument: (req: Request, res: Response) => Promise<void>;
  confirmDocument: (req: Request, res: Response) => Promise<void>;
}

/**
 * Driver session context: the authenticated driver and the load they are acting
 * on. `driverId` is set by authenticateDriverSession (from Driver.userId). The
 * load is identified explicitly by the request (param → query → body), and the
 * service authorizes that `load.driverId === driverId`.
 */
interface DriverRequestContext {
  driverId: string;
  loadId: string;
}

const getDriverRequestContext = (req: Request): DriverRequestContext => {
  if (req.driverId === undefined) {
    throw new UnauthorizedError('Driver session not set');
  }

  const fromParam = req.params['loadId'];
  const fromQuery = typeof req.query['loadId'] === 'string' ? req.query['loadId'] : undefined;
  const body = req.body as { loadId?: string } | undefined;
  const loadId = fromParam ?? fromQuery ?? body?.loadId;

  if (loadId === undefined || loadId === '') {
    throw new ValidationError('loadId is required');
  }

  return { driverId: req.driverId, loadId };
};

// ---------------------------------------------------------------------------
// Transformers
// ---------------------------------------------------------------------------

const transformLoadSummary = (
  load: DriverPortalLoadSummary,
  documents: DocumentWithUploader[],
) => {
  const cargo = computeCommoditySummary(load.stops);

  return {
  id: load.id,
  loadNumber: load.loadNumber,
  status: load.status,
  equipmentType: load.equipmentType,
  commodity: cargo.commodity ?? null,
  weight: cargo.weight ?? null,
  pieceCount: cargo.pieceCount ?? null,
  isHazmat: cargo.isHazmat,
  isTempControlled: load.stops.some((stop) => stop.isTempControlled === true),
  driverInstructions: load.driverInstructions,
  stops: load.stops.map((stop) => ({
    id: stop.id,
    type: stop.type,
    sequence: stop.sequence,
    facilityName: stop.facilityName,
    address: stop.address,
    city: stop.city,
    state: stop.state,
    zip: stop.zip,
    appointmentStart: stop.appointmentStart?.toISOString() ?? null,
    appointmentEnd: stop.appointmentEnd?.toISOString() ?? null,
    schedulingType: stop.schedulingType,
    contactName: stop.contactName,
    contactPhone: stop.contactPhone,
    notes: stop.notes,
  })),
  documents: documents
    .filter((doc) => doc.uploadStatus === 'confirmed')
    .map((doc) => ({
      id: doc.id,
      type: doc.type,
      fileName: doc.fileName,
      uploadedAt: doc.createdAt.toISOString(),
    })),
  driver: load.driver,
  };
};

const transformCheckCall = (checkCall: DriverCheckCallRecord) => ({
  id: checkCall.id,
  loadId: checkCall.loadId,
  location: checkCall.location,
  latitude: checkCall.latitude !== null ? String(checkCall.latitude) : null,
  longitude: checkCall.longitude !== null ? String(checkCall.longitude) : null,
  status: checkCall.status,
  eta: checkCall.eta?.toISOString() ?? null,
  notes: checkCall.notes,
  createdAt: checkCall.createdAt.toISOString(),
});

// ---------------------------------------------------------------------------
// Controller factory
// ---------------------------------------------------------------------------

export const createDriverPortalControllers = (
  deps: DriverPortalControllerDeps,
): DriverPortalControllers => ({
  // "My Loads" landing list — all loads assigned to the session's own driver.
  // No documents are joined here (kept light for the list); the detail page
  // fetches documents when a card is opened.
  listLoads: async (req, res) => {
    if (req.driverId === undefined) {
      throw new UnauthorizedError('Driver session not set');
    }
    if (req.organizationId === undefined) {
      throw new UnauthorizedError('Organization not resolved for session');
    }

    const loads = await deps.driverPortalService.listDriverLoads(
      req.driverId,
      req.organizationId,
    );

    sendSingle(res, loads.map((load) => transformLoadSummary(load, [])));
  },

  getLoadSummary: async (req, res) => {
    const { loadId, driverId } = getDriverRequestContext(req);
    const load = await deps.driverPortalService.getLoadSummary(loadId, driverId);
    const documents = await deps.documentService.list({
      organizationId: load.organizationId,
      entityType: 'load',
      entityId: loadId,
    });
    sendSingle(res, transformLoadSummary(load, documents));
  },

  advanceStatus: async (req, res) => {
    const { loadId, driverId } = getDriverRequestContext(req);
    const { status } = req.body as { status: string };
    const result = await deps.driverPortalService.advanceStatus(
      loadId,
      status as LoadStatus,
      driverId,
    );
    sendSingle(res, result);
  },

  checkIn: async (req, res) => {
    const { loadId, driverId } = getDriverRequestContext(req);
    const { location, latitude, longitude, status, eta, notes } = req.body as {
      location?: string;
      latitude?: number;
      longitude?: number;
      status?: string;
      eta?: string;
      notes?: string;
    };

    const checkCall = await deps.driverPortalService.checkIn(
      loadId,
      {
        location,
        latitude,
        longitude,
        status,
        eta: eta ? new Date(eta) : undefined,
        notes,
      },
      driverId,
    );

    sendSingle(res, transformCheckCall(checkCall), 201);
  },

  presignDocument: async (req, res) => {
    const { loadId, driverId } = getDriverRequestContext(req);
    const { fileName, mimeType, type } = req.body as {
      fileName: string;
      mimeType: string;
      type: string;
    };

    const validatedType = DRIVER_DOCUMENT_TYPES.find((t) => t === type);

    if (validatedType === undefined) {
      throw new ValidationError(
        `Document type must be one of: ${DRIVER_DOCUMENT_TYPES.join(', ')}`,
      );
    }

    const load = await deps.driverPortalService.getLoadSummary(loadId, driverId);

    const result = await deps.documentService.presign({
      organizationId: load.organizationId,
      entityType: 'load',
      entityId: loadId,
      type: validatedType,
      fileName,
      mimeType,
    });

    sendSingle(res, result, 201);
  },

  confirmDocument: async (req, res) => {
    const { loadId, driverId } = getDriverRequestContext(req);
    const documentId = req.params['id'];

    if (documentId === undefined) {
      throw new ValidationError('Document ID is required');
    }

    const load = await deps.driverPortalService.getLoadSummary(loadId, driverId);

    const document = await deps.documentService.confirm({
      documentId,
      organizationId: load.organizationId,
    });

    sendSingle(res, { id: document.id, uploadStatus: document.uploadStatus });
  },
});
