"""Auth domain errors for OAuth account linking."""


class AuthError(Exception):
    """Base class for auth flow errors."""


class AccountNotLinkedError(AuthError):
    """OAuth sign-in blocked: existing local account cannot be implicitly linked."""


class GoogleEmailNotVerifiedError(AuthError):
    """Google did not assert a verified email for this identity."""


class AccountAlreadyLinkedError(AuthError):
    """OAuth provider account is already linked to another user."""
