/** Helpers for cookie-session auth */

export function getErrorMessage(error: unknown): string {
  if (!error) {
    return 'Something went wrong';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object') {
    const maybe = error as { message?: unknown; detail?: unknown };
    if (typeof maybe.message === 'string' && maybe.message.trim()) {
      return maybe.message;
    }
    if (typeof maybe.detail === 'string' && maybe.detail.trim()) {
      return maybe.detail;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Something went wrong';
}
