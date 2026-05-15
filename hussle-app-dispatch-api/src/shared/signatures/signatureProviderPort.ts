import type {
  CreateSubmissionInput,
  SubmissionRef,
  SubmissionStatus,
  SignedArtifacts,
} from './types';

export interface SignatureProviderPort {
  createSubmission(input: CreateSubmissionInput): Promise<SubmissionRef>;
  getSubmission(providerSubmissionId: string): Promise<SubmissionStatus>;
  voidSubmission(providerSubmissionId: string): Promise<void>;
  fetchSignedArtifacts(providerSubmissionId: string): Promise<SignedArtifacts>;
  refreshEmbedUrl(providerSubmissionId: string): Promise<SubmissionRef>;
}
