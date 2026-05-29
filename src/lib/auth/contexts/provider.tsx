'use client';

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useMemo,
  type ReactNode,
} from 'react';
import type { AuthContextValue } from '@/lib/types/auth-context-value';
import type {  LastCall }  from '@/lib/types/last-call';
import { PublicUser } from '@/lib/types/public-user';
import { api } from '@/utils/api';
import { SignupInput } from '@/lib/types/signup-input';
import type { LoginInput } from '@/lib/types/login-input';


const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  initialUser,
  children
}: {
  initialUser: PublicUser | null;
  children: ReactNode;
}) {

  const [user, setUser] = useState<PublicUser | null>(initialUser);
  const [lastCall, setLastCall] = useState<LastCall>(null);

  const refresh = useCallback(async () => {
    const res = await api<PublicUser>('/api/auth/me');
    setUser(res.ok ? res.body as PublicUser : null)
  }, []);

  const signup = useCallback(async (input: SignupInput) => {
     const res = await api<PublicUser>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    setLastCall({
      label: 'POST /api/auth/signup',
      status: res.status,
      body: res.body
    });
    if (res.ok) setUser(res.body as PublicUser);
    return res;
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const res = await api<PublicUser>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    setLastCall({
      label: 'POST /api/auth/login',
      status: res.status,
      body: res.body
    });
    if (res.ok) setUser(res.body as PublicUser);
    return res;
  }, []);


  const logout = useCallback(async () => {
    const res = await api<{ ok: true }>('/api/auth/logout', {
      method: 'POST',
    });
    setLastCall({
      label: 'POST /api/auth/logout',
      status: res.status,
      body: res.body
    });
    if (res.ok) setUser(null);
    return res;
  }, []);

  const value = useMemo(() => ({
    user,
    lastCall,
    refresh,
    signup,
    login,
    logout,
  }), [user, lastCall, refresh, signup, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}