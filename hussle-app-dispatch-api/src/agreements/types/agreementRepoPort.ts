import type {
  Agreement,
  AgreementTemplateKey,
  CountActivePendingArgs,
  CreateAgreementInput,
  ListAgreementsFilters,
  UpdateAgreementInput,
} from './agreementTypes';

export interface AgreementRepoPort {
  create(input: CreateAgreementInput): Promise<Agreement>;
  findById(id: string): Promise<Agreement | null>;
  findByProviderSubmissionId(providerSubmissionId: string): Promise<Agreement | null>;
  findManyByOrg(filters: ListAgreementsFilters): Promise<{ data: Agreement[]; total: number }>;
  findLatestForCarrier(
    carrierId: string,
    templateKey: AgreementTemplateKey,
  ): Promise<Agreement | null>;
  update(id: string, patch: UpdateAgreementInput): Promise<Agreement>;
  findStaleInProgress(updatedBefore: Date): Promise<Agreement[]>;
  countActivePending(args: CountActivePendingArgs): Promise<number>;
}
