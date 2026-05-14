import type {
  CreateSubmissionInput,
  SignedArtifacts,
  SubmissionRef,
  SubmissionStatus,
} from './types';

export interface SignatureProviderPort {
  createSubmission(input: CreateSubmissionInput): Promise<SubmissionRef>;
  getSubmission(providerSubmissionId: string): Promise<SubmissionStatus>;
  voidSubmission(providerSubmissionId: string): Promise<void>;
  fetchSignedArtifacts(providerSubmissionId: string): Promise<SignedArtifacts>;
}
