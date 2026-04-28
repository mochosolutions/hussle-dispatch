import { documentUploadedSmsBody } from '../documentUploadedSms';

describe('documentUploadedSmsBody', () => {
  it('includes tracking URL suffix when trackingUrl is present', () => {
    // Arrange
    const ctx = {
      loadNumber: 'LD-001',
      documentType: 'BOL_SIGNED',
      trackingUrl: 'http://localhost:5173/tracking/abc123',
    };

    // Act
    const result = documentUploadedSmsBody(ctx);

    // Assert
    expect(result).toBe(
      'Load LD-001: BOL_SIGNED uploaded. Track: http://localhost:5173/tracking/abc123',
    );
  });

  it('omits tracking suffix when trackingUrl is null', () => {
    // Arrange
    const ctx = {
      loadNumber: 'LD-002',
      documentType: 'RATE_CONFIRMATION',
      trackingUrl: null,
    };

    // Act
    const result = documentUploadedSmsBody(ctx);

    // Assert
    expect(result).toBe('Load LD-002: RATE_CONFIRMATION uploaded.');
  });
});
