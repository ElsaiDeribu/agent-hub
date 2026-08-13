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
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    confirm_password: string,
    first_name: string,
    last_name: string
  ) => Promise<void>;
  loginWithGoogle: () => void;
  logout: () => Promise<void>;
};
