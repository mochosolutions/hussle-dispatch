/**
 * Expense category constants — derived from the ExpenseCategory Prisma enum.
 */
export const EXPENSE_CATEGORIES = ['FIXED', 'VARIABLE', 'SERVICE', 'WAGE', 'DEDUCTION'] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
