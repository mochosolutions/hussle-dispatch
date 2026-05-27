import type { PrismaClient, Contact } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';

export interface PortalContactRepoPort {
  upsertPrimaryContact(input: {
    organizationId: string;
    existingContactId: string | null;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
  }): Promise<Contact>;
}

export const portalContactRepoPrisma = (
  prisma: PrismaClient | PrismaTransaction,
): PortalContactRepoPort => ({
  upsertPrimaryContact: async (input) => {
    if (input.existingContactId !== null) {
      return prisma.contact.update({
        where: { id: input.existingContactId },
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          email: input.email,
        },
      });
    }

    return prisma.contact.create({
      data: {
        organizationId: input.organizationId,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        email: input.email,
        role: 'primary_contact',
      },
    });
  },
});
