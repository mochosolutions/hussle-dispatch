// ---------------------------------------------------------------------------
// Document packet (ZIP) generation types
// ---------------------------------------------------------------------------

export interface PacketDocument {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface DocumentPacketInput {
  invoiceId: string;
}

export interface DocumentQueryPort {
  findConfirmedByEntity(
    entityType: string,
    entityId: string,
  ): Promise<{
    id: string;
    type: string;
    fileName: string;
    mimeType: string | null;
    s3Key: string;
  }[]>;
}

export interface DocumentPacketPort {
  generatePacket(input: DocumentPacketInput): Promise<Buffer>;
}
