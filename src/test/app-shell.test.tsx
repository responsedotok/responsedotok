import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const h = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('@/utils/_request', () => ({ _request: h.request }));

import { AppShell } from '@/components/app-shell';
import { AuthProvider } from '@/lib/auth/contexts/provider';
import type { PublicUser } from '@/lib/types/public-user';

const push = vi.fn();

const user: PublicUser = {
  id: 'u1',
  username: 'band',
  email: 'band@example.com',
  display_name: 'The Band',
  avatar_url: null,
  bio: null,
  created_at: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useRouter).mockReturnValue({
    push,
  } as unknown as ReturnType<typeof useRouter>);
});

function renderShell(initialUser: PublicUser | null) {
  return render(
    <AuthProvider initialUser={initialUser}>
      <AppShell>
        <p>content</p>
      </AppShell>
    </AuthProvider>,
  );
}

describe('AppShell', () => {
  test('renders children', () => {
    renderShell(null);
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  test('hides the user controls when signed out', () => {
    renderShell(null);
    expect(
      screen.queryByRole('button', { name: 'Log out' }),
    ).not.toBeInTheDocument();
  });

  test('shows the display name and logs out then redirects', async () => {
    h.request.mockResolvedValue({ ok: true, status: 200, body: { ok: true } });
    const u = userEvent.setup();
    renderShell(user);

    expect(screen.getByText('The Band')).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Log out' }));

    expect(h.request).toHaveBeenCalledWith(
      '/api/auth/logout',
      expect.objectContaining({ method: 'POST' }),
    );
    await waitFor(() => expect(push).toHaveBeenCalledWith('/auth/login'));
  });
});
