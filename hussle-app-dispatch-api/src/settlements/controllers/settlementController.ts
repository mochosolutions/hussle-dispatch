import type { Request, Response, RequestHandler } from 'express';
import type {
  GenerateSettlementInput,
  ListSettlementsInput,
  ApproveSettlementInput,
  PaySettlementInput,
  DisputeSettlementInput,
  SendSettlementInput,
  SettlementWithRelations,
  SettlementListItem,
} from '../types/settlementTypes';
import type { SettlementTemplateData } from '../templates/SettlementPdfTemplate';
import type { PaginationMeta } from '../../shared/responseEnvelope';
import { sendSingle, sendList } from '../../shared/responseEnvelope';
import {
  toSettlementDetailResponse,
  toSettlementListResponse,
} from './transformers/settlementTransformer';
import {
  generateSettlementMapper,
  listSettlementsMapper,
  getSettlementMapper,
  approveSettlementMapper,
  paySettlementMapper,
  disputeSettlementMapper,
  sendSettlementMapper,
} from './mappers/settlementMappers';

interface SettlementControllerDeps {
  settlementService: {
    generate: (input: GenerateSettlementInput) => Promise<SettlementWithRelations>;
    list: (
      input: ListSettlementsInput,
    ) => Promise<{ data: SettlementListItem[]; meta: PaginationMeta }>;
    getById: (input: {
      organizationId: string;
      settlementId: string;
    }) => Promise<SettlementWithRelations>;
    approve: (input: ApproveSettlementInput) => Promise<SettlementWithRelations>;
    pay: (input: PaySettlementInput) => Promise<SettlementWithRelations>;
    dispute: (input: DisputeSettlementInput) => Promise<SettlementWithRelations>;
  };
  sendSettlementEmail: (input: SendSettlementInput) => Promise<SettlementWithRelations>;
  buildPdfData: (settlement: SettlementWithRelations) => SettlementTemplateData;
  pdfService: {
    generateSettlementPdf: (data: SettlementTemplateData) => Promise<Buffer>;
  };
}

export interface SettlementControllers {
  generate: RequestHandler;
  list: RequestHandler;
  getById: RequestHandler;
  approve: RequestHandler;
  pay: RequestHandler;
  dispute: RequestHandler;
  downloadPdf: RequestHandler;
  sendEmail: RequestHandler;
}

export const createSettlementControllers = (
  deps: SettlementControllerDeps,
): SettlementControllers => ({
  generate: async (req: Request, res: Response): Promise<void> => {
    const input = generateSettlementMapper(req);
    const settlement = await deps.settlementService.generate(input);
    sendSingle(res, toSettlementDetailResponse(settlement), 201);
  },

  list: async (req: Request, res: Response): Promise<void> => {
    const input = listSettlementsMapper(req);
    const result = await deps.settlementService.list(input);
    sendList(res, { data: toSettlementListResponse(result.data), meta: result.meta });
  },

  getById: async (req: Request, res: Response): Promise<void> => {
    const input = getSettlementMapper(req);
    const settlement = await deps.settlementService.getById(input);
    sendSingle(res, toSettlementDetailResponse(settlement));
  },

  approve: async (req: Request, res: Response): Promise<void> => {
    const input = approveSettlementMapper(req);
    const settlement = await deps.settlementService.approve(input);
    sendSingle(res, toSettlementDetailResponse(settlement));
  },

  pay: async (req: Request, res: Response): Promise<void> => {
    const input = paySettlementMapper(req);
    const settlement = await deps.settlementService.pay(input);
    sendSingle(res, toSettlementDetailResponse(settlement));
  },

  dispute: async (req: Request, res: Response): Promise<void> => {
    const input = disputeSettlementMapper(req);
    const settlement = await deps.settlementService.dispute(input);
    sendSingle(res, toSettlementDetailResponse(settlement));
  },

  downloadPdf: async (req: Request, res: Response): Promise<void> => {
    const input = getSettlementMapper(req);
    const settlement = await deps.settlementService.getById(input);
    const pdfData = deps.buildPdfData(settlement);
    const pdfBuffer = await deps.pdfService.generateSettlementPdf(pdfData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="Settlement_${settlement.settlementNumber}.pdf"`,
    );
    res.send(pdfBuffer);
  },

  sendEmail: async (req: Request, res: Response): Promise<void> => {
    const input = sendSettlementMapper(req);
    const settlement = await deps.sendSettlementEmail(input);
    sendSingle(res, toSettlementDetailResponse(settlement));
  },
});
