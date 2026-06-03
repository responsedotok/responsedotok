import type { z } from 'zod';
import type { presskitSchema } from '@/app/(app)/_schemas/presskit-schema';

export type CreateKitInput = z.input<typeof presskitSchema>;
