import { notificationLogRepositoryPrisma } from '../../repositories/notificationLogRepositoryPrisma';
import { loadNotificationOverrideRepositoryPrisma } from '../../repositories/loadNotificationOverrideRepositoryPrisma';
import { createLoadNotificationControllers } from '../../controllers/loadNotificationController';
import { createLoadNotificationOverrideService } from '../loadNotificationOverrideService';
import type { Request, Response } from 'express';

describe('tenant scoping', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('notificationLogRepositoryPrisma.findByLoadId', () => {
    it('passes organizationId via load relation filter to prisma', async () => {
      // Arrange
      const findMany = jest.fn().mockResolvedValue([]);
      const prisma = {
        notificationLog: { findMany, create: jest.fn() },
      } as never;
      const repo = notificationLogRepositoryPrisma(prisma);

      // Act
      await repo.findByLoadId('load-1', 'org-1');

      // Assert
      expect(findMany).toHaveBeenCalledWith({
        where: { loadId: 'load-1', load: { organizationId: 'org-1' } },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('loadNotificationOverrideRepositoryPrisma.findByLoadId', () => {
    it('passes organizationId via load relation filter to prisma', async () => {
      // Arrange
      const findMany = jest.fn().mockResolvedValue([]);
      const prisma = {
        loadNotificationOverride: {
          findMany,
          upsert: jest.fn(),
          deleteMany: jest.fn(),
        },
      } as never;
      const repo = loadNotificationOverrideRepositoryPrisma(prisma);

      // Act
      await repo.findByLoadId('load-1', 'org-1');

      // Assert
      expect(findMany).toHaveBeenCalledWith({
        where: { loadId: 'load-1', load: { organizationId: 'org-1' } },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('loadNotificationOverrideService.getByLoadId', () => {
    it('forwards organizationId to overrideRepo.findByLoadId', async () => {
      // Arrange
      const overrideRepo = {
        findByLoadId: jest.fn().mockResolvedValue([]),
        upsert: jest.fn(),
        deleteByLoadIdAndTriggerChannel: jest.fn(),
      };
      const service = createLoadNotificationOverrideService({ overrideRepo });

      // Act
      await service.getByLoadId('load-1', 'org-1');

      // Assert
      expect(overrideRepo.findByLoadId).toHaveBeenCalledWith('load-1', 'org-1');
    });
  });

  describe('loadNotificationController.getHistory', () => {
    it('reads organizationId from req.scope and passes to logRepo.findByLoadId', async () => {
      // Arrange
      const logRepo = {
        create: jest.fn(),
        findByLoadId: jest.fn().mockResolvedValue([]),
      };
      const overrideService = {
        getByLoadId: jest.fn().mockResolvedValue([]),
        upsert: jest.fn(),
        bulkUpsert: jest.fn(),
      };
      const controllers = createLoadNotificationControllers({
        overrideService,
        logRepo,
      });

      const req = {
        params: { loadId: 'load-1' },
        organizationId: 'org-1',
      } as unknown as Request;

      const json = jest.fn();
      const status = jest.fn().mockReturnValue({ json });
      const res = { status, json } as unknown as Response;

      // Act
      await controllers.getHistory(req, res, jest.fn());

      // Assert
      expect(logRepo.findByLoadId).toHaveBeenCalledWith('load-1', 'org-1');
    });
  });

  describe('loadNotificationController.getOverrides', () => {
    it('reads organizationId from req.scope and passes to overrideService.getByLoadId', async () => {
      // Arrange
      const logRepo = {
        create: jest.fn(),
        findByLoadId: jest.fn().mockResolvedValue([]),
      };
      const overrideService = {
        getByLoadId: jest.fn().mockResolvedValue([]),
        upsert: jest.fn(),
        bulkUpsert: jest.fn(),
      };
      const controllers = createLoadNotificationControllers({
        overrideService,
        logRepo,
      });

      const req = {
        params: { loadId: 'load-1' },
        organizationId: 'org-1',
      } as unknown as Request;

      const json = jest.fn();
      const status = jest.fn().mockReturnValue({ json });
      const res = { status, json } as unknown as Response;

      // Act
      await controllers.getOverrides(req, res, jest.fn());

      // Assert
      expect(overrideService.getByLoadId).toHaveBeenCalledWith('load-1', 'org-1');
    });
  });
});
