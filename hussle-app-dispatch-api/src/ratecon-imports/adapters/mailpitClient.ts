import type { Logger } from '@/shared/utils/logger';

export interface MailpitAttachment {
  partId: string;
  fileName: string;
  contentType: string;
}

export interface MailpitMessage {
  id: string;
  messageId: string | null;
  fromAddress: string | null;
  toAddresses: string[];
  subject: string | null;
  attachments: MailpitAttachment[];
}

export interface MailpitClient {
  fetchMessage(id: string): Promise<MailpitMessage>;
  fetchPart(id: string, partId: string): Promise<Buffer>;
}

export interface MailpitClientConfig {
  baseUrl: string;
  logger: Logger;
  fetchImpl?: typeof fetch;
}

interface RawMailpitMessage {
  ID: string;
  MessageID?: string;
  From?: { Address?: string } | null;
  To?: { Address?: string }[] | null;
  Subject?: string;
  Attachments?: { PartID: string; FileName: string; ContentType: string }[];
}

export const createMailpitClient = (config: MailpitClientConfig): MailpitClient => {
  const fetchFn = config.fetchImpl ?? fetch;

  return {
    fetchMessage: async (id) => {
      const response = await fetchFn(`${config.baseUrl}/api/v1/message/${id}`);
      if (!response.ok) {
        throw new Error(`Mailpit message fetch failed: ${String(response.status)}`);
      }
      const raw = (await response.json()) as RawMailpitMessage;
      return {
        id: raw.ID,
        messageId: raw.MessageID ?? null,
        fromAddress: raw.From?.Address ?? null,
        toAddresses: (raw.To ?? []).map((t) => t.Address ?? '').filter((a) => a.length > 0),
        subject: raw.Subject ?? null,
        attachments: (raw.Attachments ?? []).map((a) => ({
          partId: a.PartID,
          fileName: a.FileName,
          contentType: a.ContentType,
        })),
      };
    },

    fetchPart: async (id, partId) => {
      const response = await fetchFn(`${config.baseUrl}/api/v1/message/${id}/part/${partId}`);
      if (!response.ok) {
        throw new Error(`Mailpit part fetch failed: ${String(response.status)}`);
      }
      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer);
    },
  };
};
