import axiosInstance from 'utils/axios';
import type {
  ExpenseListItem,
  CreateExpenseInput,
  PaginationMeta,
} from 'features/accounting/types';

// ---------------------------------------------------------------------------
// Request / Response types
// ---------------------------------------------------------------------------

interface GetExpensesParams {
  page?: number;
  limit?: number;
  category?: string;
  vehicleId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

interface GetExpensesResponse {
  data: ExpenseListItem[];
  meta: PaginationMeta;
}

interface CreateExpenseResponse {
  data: ExpenseListItem;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export const getExpenses = async (
  params: GetExpensesParams,
): Promise<{ data: ExpenseListItem[]; meta: PaginationMeta }> => {
  const response = await axiosInstance.get<GetExpensesResponse>('/expenses', { params });
  return response.data;
};

export const createExpense = async (input: CreateExpenseInput): Promise<ExpenseListItem> => {
  const response = await axiosInstance.post<CreateExpenseResponse>('/expenses', input);
  return response.data.data;
};
