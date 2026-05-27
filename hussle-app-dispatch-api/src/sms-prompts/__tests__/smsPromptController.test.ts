import type { Request, Response } from 'express';
import type { SmsPromptSchedule } from '@prisma/client';
import { createSmsPromptController } from '../controllers/smsPromptController';
import type { SmsPromptService } from '../services/smsPromptService';

const makeScheduleRow = (
  overrides: Partial<SmsPromptSchedule> = {},
): SmsPromptSchedule => ({
  id: overrides.id ?? 'row-1',
  loadId: overrides.loadId ?? 'load-1',
  driverId: overrides.driverId ?? 'driver-1',
  organizationId: overrides.organizationId ?? 'org-1',
  anchor: overrides.anchor ?? 'MANUAL',
  scheduledAt: overrides.scheduledAt ?? new Date('2026-05-01T12:00:00Z'),
  status: overrides.status ?? 'PENDING',
  sentAt: overrides.sentAt ?? null,
  twilioMessageSid: overrides.twilioMessageSid ?? null,
  failureReason: overrides.failureReason ?? null,
  createdAt: overrides.createdAt ?? new Date('2026-05-01T12:00:00Z'),
  updatedAt: overrides.updatedAt ?? new Date('2026-05-01T12:00:00Z'),
});

const buildResMock = (): jest.Mocked<Response> => {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  } as unknown as jest.Mocked<Response>;
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
};

const buildNext = () => jest.fn();

describe('smsPromptController', () => {
  describe('sendManual', () => {
    it('maps request, calls service, and returns 201 with the transformed row', async () => {
      // Arrange
      const row = makeScheduleRow();
      const service: jest.Mocked<SmsPromptService> = {
        sendManualPrompt: jest.fn().mockResolvedValue(row),
        listPromptsForLoad: jest.fn(),
      };
      const logger = {
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };
      const controllers = createSmsPromptController({
        smsPromptService: service,
        logger,
      });

      const req = {
        params: { loadId: 'load-1' },
        organizationId: 'org-1',
        user: { userId: 'user-1' },
      } as unknown as Request;
      const res = buildResMock();

      // Act
      await controllers.sendManual(req, res, buildNext());

      // Assert
      expect(service.sendManualPrompt).toHaveBeenCalledWith({
        loadId: 'load-1',
        organizationId: 'org-1',
        requestingUserId: 'user-1',
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'row-1',
          anchor: 'MANUAL',
          status: 'PENDING',
          scheduledAt: row.scheduledAt.toISOString(),
          sentAt: null,
          twilioMessageSid: null,
        }),
      });
    });
  });

  describe('listForLoad', () => {
    it('uses pagination params and returns transformed list via sendList', async () => {
      // Arrange
      const rows = [
        makeScheduleRow({ id: 'row-1' }),
        makeScheduleRow({ id: 'row-2' }),
      ];
      const service: jest.Mocked<SmsPromptService> = {
        sendManualPrompt: jest.fn(),
        listPromptsForLoad: jest.fn().mockResolvedValue({
          data: rows,
          meta: {
            page: 2,
            limit: 10,
            total: 25,
            totalPages: 3,
            hasMore: true,
          },
        }),
      };
      const logger = {
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };
      const controllers = createSmsPromptController({
        smsPromptService: service,
        logger,
      });

      const req = {
        params: { loadId: 'load-1' },
        query: { page: '2', limit: '10' },
        organizationId: 'org-1',
        user: { userId: 'user-1' },
      } as unknown as Request;
      const res = buildResMock();

      // Act
      await controllers.listForLoad(req, res, buildNext());

      // Assert
      expect(service.listPromptsForLoad).toHaveBeenCalledWith({
        loadId: 'load-1',
        organizationId: 'org-1',
        page: 2,
        limit: 10,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ id: 'row-1' }),
          expect.objectContaining({ id: 'row-2' }),
        ]),
        meta: {
          page: 2,
          limit: 10,
          total: 25,
          totalPages: 3,
          hasMore: true,
        },
      });
    });
  });
});
