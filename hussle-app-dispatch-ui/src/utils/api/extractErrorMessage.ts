interface BackendErrorShape {
  response?: { data?: { errors?: { message: string }[] } };
}

const hasBackendErrorShape = (error: unknown): error is BackendErrorShape =>
  typeof error === 'object' && error !== null && 'response' in error;

/**
 * Extracts the best error message from any unknown error, preferring the
 * backend's `response.data.errors[0].message` envelope (matches the dispatch-api
 * CustomError.serializeErrors contract) and falling back to Error.message,
 * then a generic default.
 */
export const extractErrorMessage = (
  error: unknown,
  fallback = 'Something went wrong',
): string => {
  if (hasBackendErrorShape(error)) {
    const backendMessage = error.response?.data?.errors?.[0]?.message;
    if (typeof backendMessage === 'string' && backendMessage.length > 0) {
      return backendMessage;
    }
  }
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }
  return fallback;
};
