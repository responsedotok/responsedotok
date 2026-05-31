import type { z } from 'zod';
import type { presskitSchema } from '@/app/(app)/presskit/presskit-schema';

export type CreateKitInput = z.input<typeof presskitSchema>;
