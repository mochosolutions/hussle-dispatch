export interface LoadTimestampPort {
  updateTimestamp(
    loadId: string,
    field: 'rateConReceivedAt' | 'bolUnsignedAt' | 'bolSignedAt',
    timestamp: Date,
  ): Promise<void>;
}
