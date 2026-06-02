export interface LoadTimestampPort {
  /**
   * Monotonic set-if-null write: stamps the field only when it is currently
   * null, so duplicate `document.confirmed` deliveries leave the timestamp set
   * once (idempotent) while a load whose field is still null is reconcilable by
   * a later event (backfill). A second delivery is a no-op at the data layer.
   */
  setTimestampIfNull(
    loadId: string,
    field: 'rateConReceivedAt' | 'bolUnsignedAt' | 'bolSignedAt',
    timestamp: Date,
  ): Promise<void>;
}
