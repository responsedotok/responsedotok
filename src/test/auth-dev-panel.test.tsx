import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

const h = vi.hoisted(() => ({ useAuth: vi.fn() }));
vi.mock('@/lib/auth/contexts/provider', () => ({ useAuth: h.useAuth }));

import { AuthDevPanel } from '@/app/auth/auth-dev-panel';

describe('AuthDevPanel', () => {
  test('renders nothing until a call has been made', () => {
    h.useAuth.mockReturnValue({ lastCall: null });
    const { container } = render(<AuthDevPanel />);
    expect(container).toBeEmptyDOMElement();
  });

  test('shows the last call label, status, and pretty-printed body', () => {
    h.useAuth.mockReturnValue({
      lastCall: {
        label: 'POST /_request/auth/login',
        status: 401,
        body: { error: 'Invalid credentials' },
      },
    });
    render(<AuthDevPanel />);

    expect(screen.getByText('POST /_request/auth/login')).toBeInTheDocument();
    expect(screen.getByText('401')).toBeInTheDocument();
    expect(screen.getByText(/Invalid credentials/)).toBeInTheDocument();
  });
});
