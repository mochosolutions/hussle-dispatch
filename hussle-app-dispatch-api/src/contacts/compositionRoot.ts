import type { PrismaClient } from '@prisma/client';
import type { PrismaTransaction } from '@/config/database';
import { createContactControllers } from './controllers/contactController';
import type { ContactControllers } from './controllers/contactController';
import { contactRepositoryPrisma } from './repositories/contactRepositoryPrisma';
import { createContactService } from './services/contactService';

interface ContactModuleDeps {
  prismaClient: PrismaClient | PrismaTransaction;
}

export const createContactsModule = ({
  prismaClient,
}: ContactModuleDeps): {
  controllers: ContactControllers;
} => {
  const repositories = contactRepositoryPrisma(prismaClient);

  const contactService = createContactService({
    contactRepository: repositories,
  });

  const controllers = createContactControllers({
    contactService,
  });

  return { controllers };
};
