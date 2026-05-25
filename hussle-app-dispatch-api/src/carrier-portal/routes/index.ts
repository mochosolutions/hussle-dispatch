import express from 'express';
import { publicRateLimiter, geocodingRateLimiter } from '@/shared/middleware/rateLimiter';
import { validateRequest } from '@/shared/middleware/validateRequest';
import { addressSearchValidator } from '@/places/validators/addressSearchValidator';
import { submitStepValidator } from '../validators/sessionValidators';
import { companyValidator } from '../validators/companyValidator';
import { equipmentValidator } from '../validators/equipmentValidator';
import { driversValidator } from '../validators/driversValidator';
import { costAnalysisValidator } from '../validators/costAnalysisValidator';
import { lanePreferencesValidator } from '../validators/lanePreferencesValidator';
import {
  presignDocumentValidator,
  confirmDocumentValidator,
} from '../validators/documentsValidator';
import { portalAgreementListValidator } from '../validators/portalAgreementListValidator';

interface SessionControllers {
  getSession: express.RequestHandler;
  submitStep: express.RequestHandler;
  completeSession: express.RequestHandler;
}

interface CompanyControllers {
  saveCompany: express.RequestHandler;
}

interface EquipmentControllers {
  saveEquipment: express.RequestHandler;
}

interface DriversControllers {
  saveDrivers: express.RequestHandler;
}

interface CostAnalysisControllers {
  saveCostAnalysis: express.RequestHandler;
}

interface LanePreferencesControllers {
  saveLanePreferences: express.RequestHandler;
}

interface DocumentsControllers {
  listDocuments: express.RequestHandler;
  presignDocument: express.RequestHandler;
  confirmDocument: express.RequestHandler;
}

interface AgreementControllers {
  getLatestForCarrier: express.RequestHandler;
  voidForReSign: express.RequestHandler;
  mockSign?: express.RequestHandler;
}

interface PlacesControllers {
  addressSearch: express.RequestHandler;
}

interface CarrierPortalRouteControllers {
  session: SessionControllers;
  company: CompanyControllers;
  equipment: EquipmentControllers;
  drivers: DriversControllers;
  costAnalysis: CostAnalysisControllers;
  lanePreferences: LanePreferencesControllers;
  documents: DocumentsControllers;
  agreement: AgreementControllers;
  places: PlacesControllers;
}

interface CarrierPortalRouteMiddleware {
  authenticateCarrierToken: express.RequestHandler;
}

export const createCarrierPortalRouter = (
  controllers: CarrierPortalRouteControllers,
  middleware: CarrierPortalRouteMiddleware,
): express.Router => {
  const router = express.Router();

  router.use(publicRateLimiter);
  router.use(middleware.authenticateCarrierToken);

  // Session endpoints
  router.get('/session', controllers.session.getSession);
  router.post(
    '/session/submit-step',
    validateRequest(submitStepValidator),
    controllers.session.submitStep,
  );
  router.post('/session/complete', controllers.session.completeSession);

  // Phase 1: Company
  router.post('/company', validateRequest(companyValidator), controllers.company.saveCompany);

  // Phase 2: Equipment
  router.post('/equipment', validateRequest(equipmentValidator), controllers.equipment.saveEquipment);

  // Phase 3: Drivers
  router.post('/drivers', validateRequest(driversValidator), controllers.drivers.saveDrivers);

  // Phase 4: Cost Analysis
  router.post(
    '/cost-analysis',
    validateRequest(costAnalysisValidator),
    controllers.costAnalysis.saveCostAnalysis,
  );

  // Phase 5: Lane Preferences
  router.post(
    '/lane-preferences',
    validateRequest(lanePreferencesValidator),
    controllers.lanePreferences.saveLanePreferences,
  );

  // Phase 6: Documents
  router.get('/documents', controllers.documents.listDocuments);
  router.post(
    '/documents/presign',
    validateRequest(presignDocumentValidator),
    controllers.documents.presignDocument,
  );
  router.post(
    '/documents/:id/confirm',
    validateRequest(confirmDocumentValidator),
    controllers.documents.confirmDocument,
  );

  // Places — portal-authenticated address typeahead (BUG-06). Token auth
  // middleware is applied at the router level above; do not add requireAuth.
  router.get(
    '/places/address-search',
    geocodingRateLimiter,
    validateRequest(addressSearchValidator),
    controllers.places.addressSearch,
  );

  // Agreements — portal queries the carrier's most-recent agreement for a
  // template. carrierId comes from the invite-token context, not the query.
  router.get(
    '/agreements',
    validateRequest(portalAgreementListValidator),
    controllers.agreement.getLatestForCarrier,
  );

  // Mid-signing edit guard: void all signed agreements when the carrier
  // changes an identity field (legalName / mcNumber / dotNumber) that's
  // embedded in the signed PDF. Body validation handled inline.
  router.post('/agreements/void-for-resign', controllers.agreement.voidForReSign);

  // Dev-only: mock-sign endpoint. Mounted only when env.SIGNATURE_PROVIDER === 'mock';
  // the agreements module returns mockSignAgreement: undefined in production, which
  // makes controllers.agreement.mockSign undefined, which skips this mount → 404
  // by Express default.
  if (controllers.agreement.mockSign) {
    router.post('/agreements/:id/mock-sign', controllers.agreement.mockSign);
  }

  return router;
};
