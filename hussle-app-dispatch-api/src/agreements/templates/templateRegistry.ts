import { AgreementTemplateKey } from '@prisma/client';

import { env } from '@/config/env';

import {
  DISPATCH_AGREEMENT_FIELDS,
  type DispatchAgreementFieldName,
} from './dispatchAgreementFields';

/**
 * Context passed to a template's buildVariables. The minimum shape needed for
 * DocuSeal pre-fill across all templates today. Widen if a future template
 * needs more (equipment list, driver count, etc.).
 */
export interface BuildVariablesContext {
  carrier: {
    legalName: string;
    mcNumber: string;
    dotNumber: string | null;
  };
  orgName: string;
  effectiveDate: string;
}

export interface TemplateConfig {
  docusealTemplateId: number;
  buildVariables: (ctx: BuildVariablesContext) => Record<string, string>;
}

/**
 * Registry of DocuSeal agreement templates keyed by AgreementTemplateKey.
 *
 * Adding a new template:
 *   1. Add the key to the Prisma `AgreementTemplateKey` enum.
 *   2. Add a typed field constants file alongside `dispatchAgreementFields.ts`.
 *   3. Add an entry here with the DocuSeal template id (env-driven) and a
 *      buildVariables function that maps BuildVariablesContext → DocuSeal field map.
 *
 * requestAgreement.ts is template-agnostic — it looks up the entry by
 * input.templateKey and calls buildVariables, then forwards the result to
 * signatureService.createSubmission.
 */
export const TEMPLATE_REGISTRY: Record<AgreementTemplateKey, TemplateConfig> = {
  [AgreementTemplateKey.DISPATCH_AGREEMENT]: {
    docusealTemplateId: env.DOCUSEAL_DISPATCH_TEMPLATE_ID,
    buildVariables: ({
      carrier,
      orgName,
      effectiveDate,
    }): Record<DispatchAgreementFieldName, string> => ({
      [DISPATCH_AGREEMENT_FIELDS.CARRIER_LEGAL_NAME]: carrier.legalName,
      [DISPATCH_AGREEMENT_FIELDS.CARRIER_MC_NUMBER]: carrier.mcNumber,
      [DISPATCH_AGREEMENT_FIELDS.CARRIER_DOT_NUMBER]: carrier.dotNumber ?? '',
      [DISPATCH_AGREEMENT_FIELDS.DISPATCHER_ORG_NAME]: orgName,
      [DISPATCH_AGREEMENT_FIELDS.EFFECTIVE_DATE]: effectiveDate,
    }),
  },
};
