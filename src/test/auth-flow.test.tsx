import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const h = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('@/utils/_request', () => ({ _request: h.request }));

import { useLogin } from '@/app/auth/hooks/use-login';
import { useSignup } from '@/app/auth/hooks/use-signup';
import { AuthProvider, useAuth } from '@/lib/auth/contexts/provider';

const push = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useRouter).mockReturnValue({
    push,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  } as unknown as ReturnType<typeof useRouter>);
});

function wrap(ui: React.ReactNode) {
  return render(<AuthProvider initialUser={null}>{ui}</AuthProvider>);
}

describe('AuthProvider', () => {
  function Probe() {
    const { user, login, logout, refresh } = useAuth();
    return (
      <div>
        <span data-testid="user">{user?.username ?? 'anon'}</span>
        <button
          type="button"
          onClick={() => login({ identifier: 'b', password: 'p' })}
        >
          login
        </button>
        <button type="button" onClick={() => logout()}>
          logout
        </button>
        <button type="button" onClick={() => refresh()}>
          refresh
        </button>
      </div>
    );
  }

  test('seeds from initialUser and sets the user after a successful login', async () => {
    h.request.mockResolvedValue({
      ok: true,
      status: 200,
      body: { username: 'band' },
    });
    const user = userEvent.setup();
    wrap(<Probe />);

    expect(screen.getByTestId('user')).toHaveTextContent('anon');
    await user.click(screen.getByText('login'));
    await waitFor(() =>
      expect(screen.getByTestId('user')).toHaveTextContent('band'),
    );
  });

  test('clears the user on logout', async () => {
    h.request
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: { username: 'band' },
      })
      .mockResolvedValueOnce({ ok: true, status: 200, body: { ok: true } });
    const user = userEvent.setup();
    wrap(<Probe />);

    await user.click(screen.getByText('login'));
    await waitFor(() =>
      expect(screen.getByTestId('user')).toHaveTextContent('band'),
    );
    await user.click(screen.getByText('logout'));
    await waitFor(() =>
      expect(screen.getByTestId('user')).toHaveTextContent('anon'),
    );
  });

  test('refresh() adopts the user returned by /me, and clears on failure', async () => {
    const user = userEvent.setup();
    wrap(<Probe />);

    h.request.mockResolvedValueOnce({
      ok: true,
      status: 200,
      body: { username: 'refreshed' },
    });
    await user.click(screen.getByText('refresh'));
    await waitFor(() =>
      expect(screen.getByTestId('user')).toHaveTextContent('refreshed'),
    );

    h.request.mockResolvedValueOnce({ ok: false, status: 401, body: null });
    await user.click(screen.getByText('refresh'));
    await waitFor(() =>
      expect(screen.getByTestId('user')).toHaveTextContent('anon'),
    );
    expect(h.request).toHaveBeenCalledWith('/api/auth/me');
  });

  test('useAuth throws when used outside a provider', () => {
    function Bare() {
      useAuth();
      return null;
    }
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Bare />)).toThrow(/within an AuthProvider/);
    spy.mockRestore();
  });
});

describe('useLogin', () => {
  function LoginForm() {
    const { onSubmit, loginErrors, loginServerError } = useLogin();
    return (
      <form onSubmit={onSubmit}>
        <input name="identifier" aria-label="identifier" />
        <input name="password" aria-label="password" />
        {loginErrors.identifier && <span role="alert">bad-id</span>}
        {loginServerError && (
          <span data-testid="server">{loginServerError}</span>
        )}
        <button type="submit">Log in</button>
      </form>
    );
  }

  test('shows client validation errors and never calls the API', async () => {
    const user = userEvent.setup();
    wrap(<LoginForm />);

    await user.type(screen.getByLabelText('identifier'), 'ab'); // too short
    await user.click(screen.getByText('Log in'));

    expect(screen.getByRole('alert')).toHaveTextContent('bad-id');
    expect(h.request).not.toHaveBeenCalled();
  });

  test('navigates to /home on a successful login', async () => {
    h.request.mockResolvedValue({
      ok: true,
      status: 200,
      body: { username: 'b' },
    });
    const user = userEvent.setup();
    wrap(<LoginForm />);

    await user.type(screen.getByLabelText('identifier'), 'band@example.com');
    await user.type(screen.getByLabelText('password'), 'secret');
    await user.click(screen.getByText('Log in'));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/home'));
  });

  test('surfaces the server error message on failure', async () => {
    h.request.mockResolvedValue({
      ok: false,
      status: 401,
      body: { error: 'Invalid credentials' },
    });
    const user = userEvent.setup();
    wrap(<LoginForm />);

    await user.type(screen.getByLabelText('identifier'), 'band@example.com');
    await user.type(screen.getByLabelText('password'), 'secret');
    await user.click(screen.getByText('Log in'));

    await waitFor(() =>
      expect(screen.getByTestId('server')).toHaveTextContent(
        'Invalid credentials',
      ),
    );
    expect(push).not.toHaveBeenCalled();
  });
});

describe('useSignup', () => {
  function SignupForm() {
    const { onSubmit, errors, serverError } = useSignup();
    return (
      <form onSubmit={onSubmit}>
        <input name="username" aria-label="username" />
        <input name="email" aria-label="email" />
        <input name="password" aria-label="password" />
        <input name="display_name" aria-label="display_name" />
        {errors.email && <span role="alert">bad-email</span>}
        {serverError && <span data-testid="server">{serverError}</span>}
        <button type="submit">Sign up</button>
      </form>
    );
  }

  async function fill(user: ReturnType<typeof userEvent.setup>, email: string) {
    await user.type(screen.getByLabelText('username'), 'band_01');
    await user.type(screen.getByLabelText('email'), email);
    await user.type(screen.getByLabelText('password'), 'longenough');
    await user.type(screen.getByLabelText('display_name'), 'The Band');
  }

  test('blocks an invalid email and skips the API call', async () => {
    const user = userEvent.setup();
    wrap(<SignupForm />);
    await fill(user, 'not-an-email');
    await user.click(screen.getByText('Sign up'));

    expect(screen.getByRole('alert')).toHaveTextContent('bad-email');
    expect(h.request).not.toHaveBeenCalled();
  });

  test('navigates to /home on success', async () => {
    h.request.mockResolvedValue({
      ok: true,
      status: 201,
      body: { username: 'b' },
    });
    const user = userEvent.setup();
    wrap(<SignupForm />);
    await fill(user, 'band@example.com');
    await user.click(screen.getByText('Sign up'));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/home'));
  });

  test('falls back to a generic message when the body has none', async () => {
    h.request.mockResolvedValue({ ok: false, status: 500, body: null });
    const user = userEvent.setup();
    wrap(<SignupForm />);
    await fill(user, 'band@example.com');
    await user.click(screen.getByText('Sign up'));

    await waitFor(() =>
      expect(screen.getByTestId('server')).toHaveTextContent(
        'Something went wrong',
      ),
    );
  });
});
