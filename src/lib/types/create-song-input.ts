import type { z } from 'zod';
import type { songSchema } from '@/app/(app)/_schemas/song-schema';

export type CreateSongInput = z.input<typeof songSchema>;
