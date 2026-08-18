'use client';

import axios, { endpoints } from '@/lib/utils/axios';
import { HOST_API } from '@/lib/config';
import { useMemo, useEffect, useReducer, useCallback } from 'react';

import { AuthContext } from './auth-context';

import type { AuthUserType, ActionMapType, AuthStateType } from '../types';

// ----------------------------------------------------------------------

enum Types {
  INITIAL = 'INITIAL',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
}

type Payload = {
  [Types.INITIAL]: {
    user: AuthUserType;
  };
  [Types.SIGN_IN]: {
    user: AuthUserType;
  };
  [Types.SIGN_OUT]: undefined;
};

type ActionsType = ActionMapType<Payload>[keyof ActionMapType<Payload>];

// ----------------------------------------------------------------------

const initialState: AuthStateType = {
  user: null,
  loading: true,
};

const reducer = (state: AuthStateType, action: ActionsType): AuthStateType => {
  if (action.type === Types.INITIAL) {
    return {
      loading: false,
      user: action.payload.user,
    };
  }
  if (action.type === Types.SIGN_IN) {
    return {
      ...state,
      user: action.payload.user,
    };
  }
  if (action.type === Types.SIGN_OUT) {
    return {
      ...state,
      user: null,
    };
  }
  return state;
};

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: Props) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const initialize = useCallback(async () => {
    try {
      // Session lives in an HttpOnly cookie; ask the API who we are.
      const res = await axios.get(endpoints.auth.me);
      const { user } = res.data;

      dispatch({
        type: Types.INITIAL,
        payload: { user: user ?? null },
      });
    } catch {
      dispatch({
        type: Types.INITIAL,
        payload: { user: null },
      });
    }
  }, []);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await axios.post(endpoints.auth.signIn, { email, password });
    const { user } = res.data;

    dispatch({
      type: Types.SIGN_IN,
      payload: { user },
    });
  }, []);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      confirm_password: string,
      first_name: string,
      last_name: string
    ) => {
      const res = await axios.post(endpoints.auth.signUp, {
        email,
        password,
        confirm_password,
        first_name,
        last_name,
      });
      return res.data as { email: string; message: string };
    },
    []
  );

  const signInWithGoogle = useCallback(() => {
    // Full-page redirect into the API OAuth start; cookie is set on callback.
    window.location.href = `${HOST_API}${endpoints.auth.signInSocial}`;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await axios.post(endpoints.auth.signOut);
    } catch {
      // Cookie clear is best-effort; always drop local auth state.
    }
    dispatch({ type: Types.SIGN_OUT });
  }, []);

  const resendVerificationEmail = useCallback(async (email: string) => {
    await axios.post(endpoints.auth.resendVerification, { email });
  }, []);

  // ----------------------------------------------------------------------

  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';
  const status = state.loading ? 'loading' : checkAuthenticated;

  const memoizedValue = useMemo(
    () => ({
      user: state.user,
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      resendVerificationEmail,
    }),
    [resendVerificationEmail, signIn, signInWithGoogle, signOut, signUp, state.user, status]
  );

  return <AuthContext.Provider value={memoizedValue}>{children}</AuthContext.Provider>;
}
