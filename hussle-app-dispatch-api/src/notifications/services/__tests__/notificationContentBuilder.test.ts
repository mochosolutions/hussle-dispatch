jest.mock('@hussle/emails', () => ({
  renderStatusChangeEmail: jest.fn().mockResolvedValue({
    subject: 'Load LD-001 — Status Update: DISPATCHED',
    html: '<p>Status changed for LD-001</p>',
  }),
  renderCheckCallEmail: jest.fn().mockResolvedValue({
    subject: 'Load LD-001 — Check Call Update',
    html: '<p>Check call for LD-001</p>',
  }),
}));

import { renderStatusChangeEmail, renderCheckCallEmail } from '@hussle/emails';
import { buildStatusChangeContent, buildCheckCallContent } from '../notificationContentBuilder';
import type { StatusChangeContext, CheckCallContext } from '../../types/notificationTypes';

const mockedRenderStatusChangeEmail = renderStatusChangeEmail as jest.Mock;
const mockedRenderCheckCallEmail = renderCheckCallEmail as jest.Mock;

describe('notificationContentBuilder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buildStatusChangeContent', () => {
    const statusChangeCtx: StatusChangeContext = {
      loadNumber: 'LD-001',
      fromStatus: 'PENDING',
      toStatus: 'DISPATCHED',
      trackingUrl: 'https://track.example.com/LD-001',
    };

    it('returns HTML from renderStatusChangeEmail containing load number', async () => {
      // Arrange — mock is set up at module level

      // Act
      const result = await buildStatusChangeContent(statusChangeCtx);

      // Assert
      expect(result.html).toContain('LD-001');
      expect(result.html).toBe('<p>Status changed for LD-001</p>');
    });

    it('returns correct subject from render function', async () => {
      // Act
      const result = await buildStatusChangeContent(statusChangeCtx);

      // Assert
      expect(result.subject).toBe('Load LD-001 — Status Update: DISPATCHED');
    });

    it('produces SMS body as plain text without HTML tags', async () => {
      // Act
      const result = await buildStatusChangeContent(statusChangeCtx);

      // Assert
      expect(result.smsBody).not.toMatch(/<[^>]+>/);
      expect(result.smsBody).toContain('LD-001');
      expect(result.smsBody).toContain('DISPATCHED');
    });

    it('calls renderStatusChangeEmail with correct args', async () => {
      // Act
      await buildStatusChangeContent(statusChangeCtx);

      // Assert
      expect(mockedRenderStatusChangeEmail).toHaveBeenCalledWith({
        loadNumber: 'LD-001',
        fromStatus: 'PENDING',
        toStatus: 'DISPATCHED',
        trackingUrl: 'https://track.example.com/LD-001',
      });
    });
  });

  describe('buildCheckCallContent', () => {
    const checkCallCtx: CheckCallContext = {
      loadNumber: 'LD-001',
      location: 'Dallas, TX',
      status: 'IN_TRANSIT',
      eta: '2026-03-25T14:00:00Z',
      trackingUrl: 'https://track.example.com/LD-001',
    };

    it('returns HTML from renderCheckCallEmail containing load number', async () => {
      // Act
      const result = await buildCheckCallContent(checkCallCtx);

      // Assert
      expect(result.html).toContain('LD-001');
      expect(result.html).toBe('<p>Check call for LD-001</p>');
    });

    it('returns correct subject from render function', async () => {
      // Act
      const result = await buildCheckCallContent(checkCallCtx);

      // Assert
      expect(result.subject).toBe('Load LD-001 — Check Call Update');
    });

    it('produces SMS body as plain text without HTML tags', async () => {
      // Act
      const result = await buildCheckCallContent(checkCallCtx);

      // Assert
      expect(result.smsBody).not.toMatch(/<[^>]+>/);
      expect(result.smsBody).toContain('LD-001');
    });

    it('handles missing optional fields gracefully with nulls', async () => {
      // Arrange
      const ctxWithNulls: CheckCallContext = {
        loadNumber: 'LD-002',
        location: null,
        status: null,
        eta: null,
        trackingUrl: null,
      };

      // Act
      const result = await buildCheckCallContent(ctxWithNulls);

      // Assert
      expect(mockedRenderCheckCallEmail).toHaveBeenCalledWith({
        loadNumber: 'LD-002',
        location: null,
        status: null,
        eta: null,
        trackingUrl: null,
      });
      expect(result.smsBody).toContain('LD-002');
      expect(result.smsBody).not.toContain('null');
    });
  });
});
