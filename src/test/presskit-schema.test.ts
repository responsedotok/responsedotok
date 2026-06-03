import { describe, expect, test } from 'vitest';
import { presskitSchema } from '@/app/(app)/_schemas/presskit-schema';
import { trackSchema } from '@/app/(app)/_schemas/tracks-schema';

const track = {
  blob_url: 'https://blob.example.com/song.mp3',
  filename: 'song.mp3',
  mime_type: 'audio/mpeg',
  size_bytes: 1234,
};

describe('trackSchema', () => {
  test('accepts a well-formed track', () => {
    expect(trackSchema.safeParse(track).success).toBe(true);
  });

  test.each([
    ['non-URL blob_url', { ...track, blob_url: 'not-a-url' }],
    ['empty filename', { ...track, filename: '' }],
    ['empty mime_type', { ...track, mime_type: '' }],
    ['zero size', { ...track, size_bytes: 0 }],
    ['negative size', { ...track, size_bytes: -1 }],
    ['fractional size', { ...track, size_bytes: 1.5 }],
  ])('rejects %s', (_label, input) => {
    expect(trackSchema.safeParse(input).success).toBe(false);
  });
});

describe('presskitSchema', () => {
  const valid = {
    artist_name: 'The Testers',
    recipient_name: 'Jordan',
    recipient_org: 'XL Recordings',
    greeting: 'Hi Jordan,',
    pitch: 'We think our sound fits your roster.',
    tracks: [track],
  };

  test('accepts a well-formed kit', () => {
    expect(presskitSchema.safeParse(valid).success).toBe(true);
  });

  test('allows recipient_org to be omitted / null', () => {
    expect(
      presskitSchema.safeParse({ ...valid, recipient_org: null }).success,
    ).toBe(true);
    const { recipient_org: _omit, ...rest } = valid;
    expect(presskitSchema.safeParse(rest).success).toBe(true);
  });

  test('trims surrounding whitespace', () => {
    const parsed = presskitSchema.parse({ ...valid, artist_name: '  Band  ' });
    expect(parsed.artist_name).toBe('Band');
  });

  test.each([
    ['no tracks', { ...valid, tracks: [] }],
    ['three tracks', { ...valid, tracks: [track, track, track] }],
    ['empty artist_name', { ...valid, artist_name: '   ' }],
    ['empty greeting', { ...valid, greeting: '' }],
    ['empty pitch', { ...valid, pitch: '' }],
    ['over-long pitch', { ...valid, pitch: 'a'.repeat(2001) }],
  ])('rejects %s', (_label, input) => {
    expect(presskitSchema.safeParse(input).success).toBe(false);
  });
});
