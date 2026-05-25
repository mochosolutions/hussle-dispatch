import { AgreementTemplateKey } from '@prisma/client';

import { DISPATCH_AGREEMENT_FIELDS } from '../templates/dispatchAgreementFields';
import {
  TEMPLATE_REGISTRY,
  type BuildVariablesContext,
} from '../templates/templateRegistry';

describe('TEMPLATE_REGISTRY', () => {
  describe('DISPATCH_AGREEMENT entry', () => {
    const baseCtx: BuildVariablesContext = {
      carrier: { legalName: 'Acme Trucking LLC', mcNumber: 'MC123456', dotNumber: 'DOT789' },
      orgName: 'Hussle Dispatch',
      effectiveDate: '2026-05-14',
    };

    it('is present in the registry', () => {
      expect(TEMPLATE_REGISTRY[AgreementTemplateKey.DISPATCH_AGREEMENT]).toBeDefined();
    });

    it('exposes a numeric docusealTemplateId', () => {
      const entry = TEMPLATE_REGISTRY[AgreementTemplateKey.DISPATCH_AGREEMENT];
      expect(typeof entry.docusealTemplateId).toBe('number');
    });

    it('buildVariables maps carrier + org + date fields onto DocuSeal field names', () => {
      const entry = TEMPLATE_REGISTRY[AgreementTemplateKey.DISPATCH_AGREEMENT];
      const result = entry.buildVariables(baseCtx);

      expect(result).toEqual({
        [DISPATCH_AGREEMENT_FIELDS.CARRIER_LEGAL_NAME]: 'Acme Trucking LLC',
        [DISPATCH_AGREEMENT_FIELDS.CARRIER_MC_NUMBER]: 'MC123456',
        [DISPATCH_AGREEMENT_FIELDS.CARRIER_DOT_NUMBER]: 'DOT789',
        [DISPATCH_AGREEMENT_FIELDS.DISPATCHER_ORG_NAME]: 'Hussle Dispatch',
        [DISPATCH_AGREEMENT_FIELDS.EFFECTIVE_DATE]: '2026-05-14',
      });
    });

    it('buildVariables substitutes empty string for null dotNumber', () => {
      const entry = TEMPLATE_REGISTRY[AgreementTemplateKey.DISPATCH_AGREEMENT];
      const result = entry.buildVariables({
        ...baseCtx,
        carrier: { ...baseCtx.carrier, dotNumber: null },
      });
      expect(result[DISPATCH_AGREEMENT_FIELDS.CARRIER_DOT_NUMBER]).toBe('');
    });
  });

  describe('coverage', () => {
    it('has an entry for every AgreementTemplateKey enum value', () => {
      // Drift catch: if Prisma adds a new template key and the registry
      // doesn't get a corresponding entry, this test fails — caller must add
      // either the entry or explicitly opt out here.
      const enumKeys = Object.values(AgreementTemplateKey);
      for (const key of enumKeys) {
        expect(TEMPLATE_REGISTRY[key]).toBeDefined();
      }
    });
  });
});
