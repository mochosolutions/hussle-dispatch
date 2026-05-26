import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';
import type { CityCoords } from '@/shared/geoLookup';
import type { DriverModuleQueries } from '@/drivers/compositionRoot';
import type { PlaceModuleQueries, PlaceModuleServices } from '@/places/compositionRoot';
import { customerRepositoryPrisma } from '@/customers/repositories/customerRepositoryPrisma';
import { documentRepositoryPrisma } from '@/documents/repositories/documentRepositoryPrisma';
import { agreementRepositoryPrisma } from '@/agreements/repositories/agreementRepositoryPrisma';
import type { SettlementFreezeQueryPort } from './types/loadTypes';
import { createAccessorialControllers } from './controllers/accessorialController';
import { createLoadControllers } from './controllers/loadController';
import { rankDriversController } from './controllers/rankDriversController';
import { createStopControllers } from './controllers/stopController';
import { createTransitionStatusController } from './controllers/transitionStatusController';
import { createVehicleWeeklyRevenueController } from './controllers/vehicleWeeklyRevenueController';
import { createWeeklyGrossController } from './controllers/weeklyGrossController';
import {
  carrierAssignmentQueryPrisma,
  driverAssignmentQueryPrisma,
  loadRepositoryPrisma,
  orgSettingsQueryPrisma,
  vehicleAssignmentQueryPrisma,
} from './repositories/loadRepositoryPrisma';
import { loadStatusRepositoryPrisma } from './repositories/loadStatusRepositoryPrisma';
import { loadPickupQueryPrisma } from './repositories/loadPickupQueryPrisma';
import { dispatcherProfileQueryPrisma } from './repositories/dispatcherProfileQueryPrisma';
import { accessorialRepositoryPrisma } from './repositories/accessorialRepositoryPrisma';
import { stopRepositoryPrisma } from './repositories/stopRepositoryPrisma';
import { weeklyGrossQueryPrisma } from './repositories/weeklyGrossQueryPrisma';
import { initializeDetentionSubscriber } from './services/detentionSubscriber';
import { createLoadService } from './services/loadService';
import { updateDispatchTerms } from './services/updateDispatchTermsService';
import type { LoadStatusService } from './services/loadStatusService';
import { createLoadStatusService } from './services/loadStatusService';
import { rankDrivers } from './services/rankDriversService';
import { settingsRepositoryPrisma } from '@/settings/repositories/settingsRepositoryPrisma';
import { createAccessorialService } from './services/accessorialService';
import { createStopService } from './services/stopService';
import { createWeeklyGrossService } from './services/weeklyGrossService';
import type { LoadRouterControllers } from './routes/loadRoutes';

interface LoadModuleDeps {
  prismaClient: PrismaClient | PrismaTransaction;
  eventBus: EventBus;
  logger: Logger;
  driverQueries: DriverModuleQueries;
  placeQueries: PlaceModuleQueries;
  placeServices: PlaceModuleServices;
  getCityCoords: (city: string, state: string) => Promise<CityCoords | null>;
  settlementFreezeQuery?: SettlementFreezeQueryPort;
}

export const createLoadsModule = ({
  prismaClient,
  eventBus,
  logger,
  driverQueries,
  placeQueries,
  placeServices,
  getCityCoords,
  settlementFreezeQuery,
}: LoadModuleDeps): {
  controllers: LoadRouterControllers;
  stopControllers: ReturnType<typeof createStopControllers>;
  accessorialControllers: ReturnType<typeof createAccessorialControllers>;
  loadStatusService: LoadStatusService;
  initializeSubscriber: () => Promise<void>;
} => {
  const loadRepository = loadRepositoryPrisma(prismaClient);
  const orgSettingsQuery = orgSettingsQueryPrisma(prismaClient);
  const carrierAssignmentQuery = carrierAssignmentQueryPrisma(prismaClient);
  const driverAssignmentQuery = driverAssignmentQueryPrisma(prismaClient);
  const vehicleAssignmentQuery = vehicleAssignmentQueryPrisma(prismaClient);
  const loadStatusRepo = loadStatusRepositoryPrisma(prismaClient);
  const weeklyGrossQuery = weeklyGrossQueryPrisma(prismaClient);
  const loadPickupQuery = loadPickupQueryPrisma(prismaClient);

  const dispatcherProfileQuery = dispatcherProfileQueryPrisma(prismaClient);

  const accessorialRepository = accessorialRepositoryPrisma(prismaClient);
  const stopRepository = stopRepositoryPrisma(prismaClient);
  const customerRepository = customerRepositoryPrisma(prismaClient);
  const settingsQuery = settingsRepositoryPrisma(prismaClient as PrismaClient);
  const documentRepoForCompliance = documentRepositoryPrisma(prismaClient);
  const agreementRepoForCompliance = agreementRepositoryPrisma(prismaClient);

  const loadService = createLoadService({
    loadRepository,
    orgSettingsQuery,
    carrierAssignmentQuery,
    driverAssignmentQuery,
    vehicleAssignmentQuery,
    customerQuery: customerRepository,
    dispatcherProfileQuery,
    settlementFreezeQuery,
    resolveStopToPlace: placeServices.resolveStopToPlace,
    derivedComplianceDeps: {
      documentRepo: documentRepoForCompliance,
      agreementRepo: agreementRepoForCompliance,
    },
    eventBus,
    logger,
  });

  const loadStatusService = createLoadStatusService({
    loadRepository,
    loadStatusRepo,
    settingsQuery,
    eventBus,
    logger,
  });

  const accessorialService = createAccessorialService({
    accessorialRepository,
    loadRepository,
    eventBus,
  });

  const stopService = createStopService({
    stopRepository,
    loadRepository,
    eventBus,
    logger,
    resolveStopToPlace: placeServices.resolveStopToPlace,
    settingsQuery,
    accessorialQuery: accessorialRepository,
    accessorialCreate: accessorialRepository,
  });

  const weeklyGrossService = createWeeklyGrossService({
    weeklyGrossQuery,
  });

  const crudControllers = createLoadControllers({
    loadService,
    updateDispatchTerms: (input) =>
      updateDispatchTerms(input, {
        loadRepository,
        eventBus,
        logger,
        settlementFreezeQuery,
      }),
  });

  const transitionStatus = createTransitionStatusController({
    loadStatusService,
  });

  const getWeeklyGross = createWeeklyGrossController({
    weeklyGrossService,
  });

  const getVehicleWeeklyRevenue = createVehicleWeeklyRevenueController({
    weeklyGrossService,
  });

  const rankDriversHandler = rankDriversController({
    rankDrivers: (input) =>
      rankDrivers(input, {
        getFirstPickup: loadPickupQuery.getFirstPickup,
        findActiveDriversForOrg: driverQueries.findActiveDriversForOrg,
        checkAvailabilityAt: driverQueries.checkAvailabilityAt,
        getCityCoords,
        isFacilityOpenAt: placeQueries.checkFacilityOpenAt,
        logger,
      }),
  });

  const accessorialCtrls = createAccessorialControllers({
    accessorialService,
  });

  const stopCtrls = createStopControllers({
    stopService,
  });

  const controllers: LoadRouterControllers = {
    ...crudControllers,
    transitionStatus,
    getWeeklyGross,
    getVehicleWeeklyRevenue,
    rankDrivers: rankDriversHandler,
  };

  const initializeSubscriber = async () => {
    await initializeDetentionSubscriber({
      eventBus,
      logger,
    });
  };

  return {
    controllers,
    stopControllers: stopCtrls,
    accessorialControllers: accessorialCtrls,
    loadStatusService,
    initializeSubscriber,
  };
};
