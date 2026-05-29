import type { PublicUser } from '@/lib/types/public-user';
import type { ApiResult } from './api-result';
import type { SignupInput } from './signup-input';
import type { LoginInput } from './login-input';
import type { LastCall } from './last-call';

export type AuthContextValue = {
  user: PublicUser | null;
  signup: (input: SignupInput) => Promise<ApiResult<PublicUser>>;
  login: (input: LoginInput) => Promise<ApiResult<PublicUser>>;
  logout: () => Promise<ApiResult<{ ok: true }>>;
  refresh: () => Promise<void>;
  lastCall: LastCall;
};