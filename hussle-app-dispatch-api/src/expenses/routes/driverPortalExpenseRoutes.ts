import express from 'express';
import { validateRequest } from '@/shared/middleware/validateRequest';
import type { DriverPortalExpenseControllers } from '../controllers/driverPortalExpenseController';
import {
  driverPortalCreateExpenseValidator,
  driverPortalUpdateExpenseValidator,
  driverPortalListExpensesValidator,
} from '../validators/driverPortalExpenseValidators';

export const createDriverPortalExpenseRouter = (
  controllers: DriverPortalExpenseControllers,
  middleware: { authenticateVehicleToken: express.RequestHandler },
): express.Router => {
  const router = express.Router();

  router.use(middleware.authenticateVehicleToken);

  router.post('/', validateRequest(driverPortalCreateExpenseValidator), controllers.createExpense);
  router.get('/', validateRequest(driverPortalListExpensesValidator), controllers.listExpenses);
  router.patch(
    '/:id',
    validateRequest(driverPortalUpdateExpenseValidator),
    controllers.editExpense,
  );

  return router;
};
