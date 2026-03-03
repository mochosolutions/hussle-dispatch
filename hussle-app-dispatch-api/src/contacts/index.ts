import { prisma } from '@/shared/prisma';
import { createContactsModule } from './compositionRoot';
import { createContactsRouter } from './routes/contactRoutes';

const contactsModule = createContactsModule({
  prismaClient: prisma,
});

export const contactsRouter = createContactsRouter(contactsModule.controllers);
