import type { Request, Response } from 'express';
import type { RequestHandler } from 'express';
import type { DriverAvailability, DriverScheduleOverride } from '@prisma/client';
import { sendSingle } from '@/shared/responseEnvelope';
import type {
  DeleteOverrideInput,
  ListOverridesInput,
  ScheduleOverrideInput,
  SetWeeklyScheduleInput,
} from '../types/driverAvailabilityTypes';
import { setWeeklyScheduleMapper } from './mappers/setWeeklyScheduleMapper';
import { setOverrideMapper } from './mappers/setOverrideMapper';
import {
  toWeeklyScheduleResponse,
  toScheduleOverrideResponse,
  toScheduleOverrideListResponse,
} from './transformers/availabilityTransformer';

interface DriverAvailabilityControllerDeps {
  setWeeklySchedule: (input: SetWeeklyScheduleInput) => Promise<DriverAvailability[]>;
  getWeeklySchedule: (input: {
    driverId: string;
    organizationId: string;
  }) => Promise<DriverAvailability[]>;
  createOverride: (input: ScheduleOverrideInput) => Promise<DriverScheduleOverride>;
  listOverrides: (input: ListOverridesInput) => Promise<DriverScheduleOverride[]>;
  deleteOverride: (input: DeleteOverrideInput) => Promise<void>;
}

export interface DriverAvailabilityControllers {
  setWeeklySchedule: RequestHandler;
  getWeeklySchedule: RequestHandler;
  createOverride: RequestHandler;
  listOverrides: RequestHandler;
  deleteOverride: RequestHandler;
}

export const createDriverAvailabilityControllers = (
  deps: DriverAvailabilityControllerDeps,
): DriverAvailabilityControllers => ({
  setWeeklySchedule: async (req: Request, res: Response): Promise<void> => {
    const input = setWeeklyScheduleMapper(req);
    const entries = await deps.setWeeklySchedule(input);
    sendSingle(res, toWeeklyScheduleResponse(entries));
  },

  getWeeklySchedule: async (req: Request, res: Response): Promise<void> => {
    const driverId = req.params['driverId'] ?? '';
    const organizationId = req.organizationId ?? '';
    const entries = await deps.getWeeklySchedule({ driverId, organizationId });
    sendSingle(res, toWeeklyScheduleResponse(entries));
  },

  createOverride: async (req: Request, res: Response): Promise<void> => {
    const input = setOverrideMapper(req);
    const override = await deps.createOverride(input);
    sendSingle(res, toScheduleOverrideResponse(override), 201);
  },

  listOverrides: async (req: Request, res: Response): Promise<void> => {
    const driverId = req.params['driverId'] ?? '';
    const organizationId = req.organizationId ?? '';
    const fromDate = (req.query['fromDate'] as string) ?? undefined;
    const toDate = (req.query['toDate'] as string) ?? undefined;
    const overrides = await deps.listOverrides({ driverId, organizationId, fromDate, toDate });
    sendSingle(res, toScheduleOverrideListResponse(overrides));
  },

  deleteOverride: async (req: Request, res: Response): Promise<void> => {
    const driverId = req.params['driverId'] ?? '';
    const organizationId = req.organizationId ?? '';
    const overrideId = req.params['overrideId'] ?? '';
    await deps.deleteOverride({ driverId, organizationId, overrideId });
    res.status(204).send();
  },
});
