import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { CopyLinkButton } from '@/app/(app)/home/copy-link-button';
import { Field } from '@/app/auth/field';

describe('Field', () => {
  test('forwards input props and has no error state by default', () => {
    render(<Field name="email" placeholder="Email" defaultValue="x" />);
    const input = screen.getByPlaceholderText('Email');
    expect(input).toHaveAttribute('name', 'email');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
  });

  test('renders the error message and marks the input invalid', () => {
    render(
      <Field name="email" placeholder="Email" error="Email is required." />,
    );
    expect(screen.getByPlaceholderText('Email')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByText('Email is required.')).toBeInTheDocument();
  });
});

describe('CopyLinkButton', () => {
  const writeText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    writeText.mockClear();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
  });
  afterEach(() => vi.useRealTimers());

  test('copies the absolute share URL and toggles the label', async () => {
    render(<CopyLinkButton token="abc123" />);

    const button = screen.getByRole('button', { name: 'Copy link' });
    fireEvent.click(button);

    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}/k/abc123`,
    );
    await waitFor(() => expect(button).toHaveTextContent('Copied'));
  });

  test('reverts the label after the 1.5s timeout', async () => {
    vi.useFakeTimers();
    render(<CopyLinkButton token="abc123" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);
    await vi.waitFor(() => expect(button).toHaveTextContent('Copied'));

    vi.advanceTimersByTime(1500);
    await vi.waitFor(() => expect(button).toHaveTextContent('Copy link'));
  });
});
