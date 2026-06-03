import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';

// jsdom loses both name and size of files read back through the
// file-input → `new FormData(form)` path (each entry becomes name="", size=0),
// so a real upload is indistinguishable from an empty input. Patch getAll to
// read the live FileList off the form's file inputs instead. Scoped to this
// file only.
let OriginalFormData: typeof FormData;
beforeAll(() => {
  OriginalFormData = globalThis.FormData;
  class PatchedFormData extends OriginalFormData {
    #form: HTMLFormElement | null = null;
    constructor(form?: HTMLFormElement) {
      super(form);
      this.#form = form ?? null;
    }
    getAll(name: string) {
      const input = this.#form?.querySelector<HTMLInputElement>(
        `input[type="file"][name="${name}"]`,
      );
      if (input?.files) return Array.from(input.files);
      return super.getAll(name);
    }
  }
  globalThis.FormData = PatchedFormData as unknown as typeof FormData;
});
afterAll(() => {
  globalThis.FormData = OriginalFormData;
});

const h = vi.hoisted(() => ({ upload: vi.fn(), createPresskit: vi.fn() }));
vi.mock('@vercel/blob/client', () => ({ upload: h.upload }));
vi.mock('@/app/(app)/presskit/create-presskit', () => ({
  createPresskit: h.createPresskit,
}));

import { CreatePresskitForm } from '@/components/create-presskit-form';

async function fillText(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText('e.g. Jordan at XL'), 'Jordan');
  await user.type(screen.getByPlaceholderText('Hi Jordan,'), 'Hi Jordan,');
  await user.type(
    screen.getByPlaceholderText(/couple of sentences/i),
    'Great fit for your roster.',
  );
}

function audio(name = 'song.mp3') {
  return new File(['AUDIO'], name, { type: 'audio/mpeg' });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CreatePresskitForm', () => {
  test('seeds the artist field and rejects a submit with no songs', async () => {
    const user = userEvent.setup();
    render(<CreatePresskitForm defaultArtist="The Testers" />);

    expect(screen.getByDisplayValue('The Testers')).toBeInTheDocument();
    await fillText(user);
    await user.click(
      screen.getByRole('button', { name: /generate press kit/i }),
    );

    expect(screen.getByText(/1 - 2 song upload limit/i)).toBeInTheDocument();
    expect(h.upload).not.toHaveBeenCalled();
  });

  test('uploads songs, creates the kit, and shows the share link', async () => {
    h.upload.mockResolvedValue({
      url: 'https://blob.example/song.mp3',
      contentType: 'audio/mpeg',
    });
    h.createPresskit.mockResolvedValue({ ok: true, token: 'kit_token_123456' });

    const user = userEvent.setup();
    render(<CreatePresskitForm defaultArtist="The Testers" />);
    await fillText(user);
    await user.upload(screen.getByLabelText(/songs/i), audio());
    await user.click(
      screen.getByRole('button', { name: /generate press kit/i }),
    );

    await waitFor(() =>
      expect(screen.getByText(/has been created/i)).toBeInTheDocument(),
    );
    expect(h.upload).toHaveBeenCalledTimes(1);
    expect(h.createPresskit).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient_name: 'Jordan',
        tracks: [
          expect.objectContaining({
            blob_url: 'https://blob.example/song.mp3',
          }),
        ],
      }),
    );
    expect(
      screen.getByText(`${window.location.origin}/presskit/kit_token_123456`),
    ).toBeInTheDocument();
  });

  test('surfaces a failure from createPresskit and returns to editing', async () => {
    h.upload.mockResolvedValue({
      url: 'https://blob.example/s.mp3',
      contentType: 'audio/mpeg',
    });
    h.createPresskit.mockResolvedValue({ ok: false, error: 'nope' });

    const user = userEvent.setup();
    render(<CreatePresskitForm defaultArtist="A" />);
    await fillText(user);
    await user.upload(screen.getByLabelText(/songs/i), audio());
    await user.click(
      screen.getByRole('button', { name: /generate press kit/i }),
    );

    await waitFor(() =>
      expect(
        screen.getByText('Failed to create presskit.'),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByRole('button', { name: /generate press kit/i }),
    ).toBeEnabled();
  });

  test('surfaces an upload exception', async () => {
    h.upload.mockRejectedValue(new Error('blob exploded'));

    const user = userEvent.setup();
    render(<CreatePresskitForm defaultArtist="A" />);
    await fillText(user);
    await user.upload(screen.getByLabelText(/songs/i), audio());
    await user.click(
      screen.getByRole('button', { name: /generate press kit/i }),
    );

    await waitFor(() =>
      expect(screen.getByText('blob exploded')).toBeInTheDocument(),
    );
    expect(h.createPresskit).not.toHaveBeenCalled();
  });
});
