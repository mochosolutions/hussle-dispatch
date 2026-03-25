import type { Request, Response } from 'express';
import type { RequestHandler } from 'express';
import { sendList, sendSingle } from '@/shared/responseEnvelope';
import type { CustomerService } from '../types/customerServiceTypes';
import type { CustomerStatsQueryPort } from '../repositories/customerStatsQueryPrisma';
import { createCustomerMapper } from './mappers/createCustomerMapper';
import { getRequiredCustomerIdMapper } from './mappers/getRequiredCustomerIdMapper';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';
import { listCustomersMapper } from './mappers/listCustomersMapper';
import { updateCustomerMapper } from './mappers/updateCustomerMapper';
import {
  toCustomerDetailResponse,
  toCustomerListEnvelope,
  toCustomerResponse,
} from './transformers/customerTransformer';

interface CustomerControllerDeps {
  customerService: CustomerService;
  customerStatsQuery: CustomerStatsQueryPort;
}

export interface CustomerControllers {
  createCustomer: RequestHandler;
  listCustomers: RequestHandler;
  getCustomerById: RequestHandler;
  updateCustomer: RequestHandler;
  deleteCustomer: RequestHandler;
  getCustomerStats: RequestHandler;
}

export const createCustomerControllers = (deps: CustomerControllerDeps): CustomerControllers => ({
  createCustomer: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = createCustomerMapper(req);
    const customer = await deps.customerService.createCustomer(serviceInput);
    sendSingle(res, toCustomerResponse(customer), 201);
  },

  listCustomers: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = listCustomersMapper(req);
    const result = await deps.customerService.listCustomers(serviceInput);
    const response = toCustomerListEnvelope(result.data, result.meta);
    sendList(res, { data: response.data, meta: response.meta });
  },

  getCustomerById: async (req: Request, res: Response): Promise<void> => {
    const context = getRequestContextMapper(req);
    const id = getRequiredCustomerIdMapper(req);
    const customer = await deps.customerService.getCustomerById({
      ...context,
      id,
    });
    sendSingle(res, toCustomerDetailResponse(customer));
  },

  updateCustomer: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = updateCustomerMapper(req);
    const customer = await deps.customerService.updateCustomer(serviceInput);
    sendSingle(res, toCustomerResponse(customer));
  },

  deleteCustomer: async (req: Request, res: Response): Promise<void> => {
    const context = getRequestContextMapper(req);
    const id = getRequiredCustomerIdMapper(req);
    await deps.customerService.deleteCustomer({
      ...context,
      id,
    });
    res.status(204).send();
  },

  getCustomerStats: async (req: Request, res: Response): Promise<void> => {
    const id = getRequiredCustomerIdMapper(req);
    const context = getRequestContextMapper(req);
    const stats = await deps.customerStatsQuery.getStats(id, context.organizationId);
    sendSingle(res, stats);
  },
});
