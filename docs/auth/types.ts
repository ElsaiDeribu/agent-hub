// ----------------------------------------------------------------------

export type ActionMapType<M extends { [index: string]: unknown }> = {
  [Key in keyof M]: M[Key] extends undefined
    ? {
        type: Key;
      }
    : {
        type: Key;
        payload: M[Key];
      };
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  image?: string;
  email_verified?: boolean;
};

export type AuthUserType = AuthUser | null;

export type AuthStateType = {
  status?: string;
  loading: boolean;
  user: AuthUserType;
};

// ----------------------------------------------------------------------

export type AuthContextType = {
  user: AuthUserType;
  loading: boolean;
  authenticated: boolean;
  unauthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    confirm_password: string,
    first_name: string,
    last_name: string
  ) => Promise<{ email: string; message: string }>;
  signInWithGoogle: () => void;
  signOut: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
};
