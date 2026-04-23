import type { StorageProvider } from '@/shared/storage';
import type { ExpenseRepoPort } from '../types/expenseTypes';
import { NotFoundError, ValidationError } from '@/shared/errors/commonErrors';

const PRESIGN_EXPIRATION_SECONDS = 900;

const MAX_SIZE_BY_MIME: Record<string, number> = {
  'application/pdf': 5 * 1024 * 1024,
  'image/png': 10 * 1024 * 1024,
  'image/jpg': 10 * 1024 * 1024,
  'image/jpeg': 10 * 1024 * 1024,
};

const ACCEPTED_MIME_TYPES = new Set(Object.keys(MAX_SIZE_BY_MIME));

const extractExtension = (fileName: string): string => {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) {
    return '';
  }
  return fileName.slice(lastDot + 1).toLowerCase();
};

const buildReceiptKey = (organizationId: string, expenseId: string, ext: string): string =>
  `${organizationId}/expenses/${expenseId}/receipt.${ext}`;

// ---------------------------------------------------------------------------
// Presign
// ---------------------------------------------------------------------------

export interface PresignReceiptInput {
  expenseId: string;
  organizationId: string;
  fileName: string;
  mimeType: string;
}

export interface PresignReceiptResult {
  presignedUrl: string;
  key: string;
  expiresIn: number;
}

// ---------------------------------------------------------------------------
// Confirm
// ---------------------------------------------------------------------------

export interface ConfirmReceiptInput {
  expenseId: string;
  organizationId: string;
}

export interface ConfirmReceiptResult {
  id: string;
  receiptUrl: string | null;
}

// ---------------------------------------------------------------------------
// Service port
// ---------------------------------------------------------------------------

export interface ReceiptServicePort {
  presign(input: PresignReceiptInput): Promise<PresignReceiptResult>;
  confirm(input: ConfirmReceiptInput): Promise<ConfirmReceiptResult>;
}

// ---------------------------------------------------------------------------
// Service deps
// ---------------------------------------------------------------------------

export interface ReceiptServiceDeps {
  expenseRepo: ExpenseRepoPort;
  storageProvider: StorageProvider;
  logger: {
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export const createReceiptService = (deps: ReceiptServiceDeps): ReceiptServicePort => ({
  presign: async (input: PresignReceiptInput): Promise<PresignReceiptResult> => {
    const expense = await deps.expenseRepo.findById(input.expenseId, input.organizationId);

    if (expense === null) {
      throw new NotFoundError(`Expense ${input.expenseId} not found`);
    }

    if (!ACCEPTED_MIME_TYPES.has(input.mimeType)) {
      throw new ValidationError(
        `Unsupported content type: ${input.mimeType}. Accepted: PDF, PNG, JPG, JPEG.`,
      );
    }

    const ext = extractExtension(input.fileName);
    if (ext === '') {
      throw new ValidationError('fileName must include a file extension');
    }

    const key = buildReceiptKey(input.organizationId, input.expenseId, ext);

    const presignedUrl = await deps.storageProvider.getPresignedPutUrl(
      key,
      input.mimeType,
      PRESIGN_EXPIRATION_SECONDS,
    );

    deps.logger.info('Receipt presigned URL generated', {
      expenseId: input.expenseId,
      key,
    });

    return {
      presignedUrl,
      key,
      expiresIn: PRESIGN_EXPIRATION_SECONDS,
    };
  },

  confirm: async (input: ConfirmReceiptInput): Promise<ConfirmReceiptResult> => {
    const expense = await deps.expenseRepo.findById(input.expenseId, input.organizationId);

    if (expense === null) {
      throw new NotFoundError(`Expense ${input.expenseId} not found`);
    }

    // Determine expected key — we need to find the uploaded file by prefix
    // since we don't know the extension at confirm time.
    // Use the storageProvider.list to find the receipt file.
    const prefix = `${input.organizationId}/expenses/${input.expenseId}/receipt.`;
    const files = await deps.storageProvider.list(prefix);

    if (files.length === 0) {
      throw new ValidationError('Receipt file not found in storage');
    }

    // Use the most recently uploaded receipt (last in list)
    const receiptKey = files[files.length - 1];

    if (receiptKey === undefined) {
      throw new ValidationError('Receipt file not found in storage');
    }

    const fileExists = await deps.storageProvider.exists(receiptKey);
    if (!fileExists) {
      throw new ValidationError('Receipt file not found in storage');
    }

    const updated = await deps.expenseRepo.update(input.expenseId, input.organizationId, {
      receiptUrl: receiptKey,
    });

    deps.logger.info('Receipt confirmed', {
      expenseId: input.expenseId,
      receiptUrl: receiptKey,
    });

    return {
      id: updated.id,
      receiptUrl: updated.receiptUrl,
    };
  },
});
