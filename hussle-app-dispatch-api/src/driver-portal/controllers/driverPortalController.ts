import type { Request, Response } from 'express';
import type { LoadStatus, DocumentType } from '@prisma/client';
import type { DocumentService } from '../../documents/types/documentServiceTypes';
import type { DriverPortalService } from '../services/driverPortalService';
import type { DriverPortalContext, DriverPortalLoadSummary } from '../types/driverPortalTypes';
import type { DriverCheckCallRecord } from '../repositories/driverPortalCheckCallRepositoryPrisma';
import { computeCommoditySummary } from '@/shared/utils/computeCommoditySummary';
import { sendSingle } from '@/shared/responseEnvelope';
import { UnauthorizedError, ValidationError } from '@/shared/errors';

interface DriverPortalControllerDeps {
  driverPortalService: DriverPortalService;
  documentService: DocumentService;
}

const DRIVER_DOCUMENT_TYPES: readonly DocumentType[] = ['BOL_SIGNED', 'POD'] as const;

export interface DriverPortalControllers {
  getLoadSummary: (req: Request, res: Response) => Promise<void>;
  advanceStatus: (req: Request, res: Response) => Promise<void>;
  checkIn: (req: Request, res: Response) => Promise<void>;
  presignDocument: (req: Request, res: Response) => Promise<void>;
  confirmDocument: (req: Request, res: Response) => Promise<void>;
}

/**
 * Extracts the driver portal context set by authenticateDriverToken middleware.
 * Throws UnauthorizedError if context is missing (should never happen after middleware).
 */
const getDriverPortal = (req: Request): DriverPortalContext => {
  if (req.driverPortal === undefined) {
    throw new UnauthorizedError('Driver portal context not set');
  }
  return req.driverPortal;
};

// ---------------------------------------------------------------------------
// Transformers
// ---------------------------------------------------------------------------

const transformLoadSummary = (load: DriverPortalLoadSummary) => {
  const cargo = computeCommoditySummary(load.stops);

  return {
  id: load.id,
  loadNumber: load.loadNumber,
  status: load.status,
  equipmentType: load.equipmentType,
  commodity: cargo.commodity ?? null,
  weight: cargo.weight ?? null,
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
    contactName: stop.contactName,
    contactPhone: stop.contactPhone,
    notes: stop.notes,
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
  getLoadSummary: async (req, res) => {
    const { loadId } = getDriverPortal(req);
    const load = await deps.driverPortalService.getLoadSummary(loadId);
    sendSingle(res, transformLoadSummary(load));
  },

  advanceStatus: async (req, res) => {
    const { loadId } = getDriverPortal(req);
    const { status } = req.body as { status: string };
    const result = await deps.driverPortalService.advanceStatus(loadId, status as LoadStatus);
    sendSingle(res, result);
  },

  checkIn: async (req, res) => {
    const { loadId } = getDriverPortal(req);
    const { location, latitude, longitude, status, eta, notes } = req.body as {
      location?: string;
      latitude?: number;
      longitude?: number;
      status?: string;
      eta?: string;
      notes?: string;
    };

    const checkCall = await deps.driverPortalService.checkIn(loadId, {
      location,
      latitude,
      longitude,
      status,
      eta: eta ? new Date(eta) : undefined,
      notes,
    });

    sendSingle(res, transformCheckCall(checkCall), 201);
  },

  presignDocument: async (req, res) => {
    const { loadId } = getDriverPortal(req);
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

    const load = await deps.driverPortalService.getLoadSummary(loadId);

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
    const { loadId } = getDriverPortal(req);
    const documentId = req.params['id'];

    if (documentId === undefined) {
      throw new ValidationError('Document ID is required');
    }

    const load = await deps.driverPortalService.getLoadSummary(loadId);

    const document = await deps.documentService.confirm({
      documentId,
      organizationId: load.organizationId,
    });

    sendSingle(res, { id: document.id, uploadStatus: document.uploadStatus });
  },
});
