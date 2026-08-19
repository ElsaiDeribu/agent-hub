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

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  account_not_linked:
    'An account with this email already exists. Verify your email, then sign in with Google again.',
  google_email_not_verified: 'Your Google email must be verified before you can sign in.',
  account_already_linked: 'This Google account is already linked to another user.',
  oauth_failed: 'Google sign-in failed. Please try again.',
  email_not_found: 'Your Google account does not include an email address.',
};

export function getOAuthErrorMessage(code: string | null | undefined): string | null {
  if (!code?.trim()) {
    return null;
  }
  return OAUTH_ERROR_MESSAGES[code.trim()] ?? 'Google sign-in failed. Please try again.';
}
