import express from 'express';
import { publicRateLimiter } from '@/shared/middleware/rateLimiter';
import { validateRequest } from '@/shared/middleware/validateRequest';
import { saveAnswerValidator, submitStepValidator } from '../validators/sessionValidators';
import { companyValidator } from '../validators/companyValidator';
import { equipmentValidator } from '../validators/equipmentValidator';
import { driversValidator } from '../validators/driversValidator';
import { costAnalysisValidator } from '../validators/costAnalysisValidator';
import { lanePreferencesValidator } from '../validators/lanePreferencesValidator';
import {
  presignDocumentValidator,
  confirmDocumentValidator,
  signDocumentValidator,
} from '../validators/documentsValidator';

interface SessionControllers {
  getSession: express.RequestHandler;
  saveAnswer: express.RequestHandler;
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
  signDocument: express.RequestHandler;
}

interface CarrierPortalRouteControllers {
  session: SessionControllers;
  company: CompanyControllers;
  equipment: EquipmentControllers;
  drivers: DriversControllers;
  costAnalysis: CostAnalysisControllers;
  lanePreferences: LanePreferencesControllers;
  documents: DocumentsControllers;
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
  router.put('/session/answer', validateRequest(saveAnswerValidator), controllers.session.saveAnswer);
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
  router.post(
    '/documents/:id/sign',
    validateRequest(signDocumentValidator),
    controllers.documents.signDocument,
  );

  return router;
};
