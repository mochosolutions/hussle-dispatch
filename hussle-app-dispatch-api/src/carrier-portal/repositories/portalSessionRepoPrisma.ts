import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';

export interface PortalLanePreferencesSessionPort {
  getAnswers(carrierId: string): Promise<Record<string, unknown> | null>;
  updateAnswers(carrierId: string, answers: Record<string, unknown>): Promise<void>;
}

export const portalLanePreferencesSessionRepoPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): PortalLanePreferencesSessionPort => ({
  getAnswers: async (carrierId) => {
    const session = await prisma.onboardingSession.findUnique({
      where: { carrierId },
    });
    if (!session) {
      return null;
    }
    const raw = session.answers;
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      return {};
    }
    return raw as Record<string, unknown>;
  },

  updateAnswers: async (carrierId, answers) => {
    const jsonValue = JSON.parse(JSON.stringify(answers));
    await prisma.onboardingSession.update({
      where: { carrierId },
      data: { answers: jsonValue },
    });
  },
});
