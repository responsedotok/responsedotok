import { z } from 'zod';
import { presskitSchema } from '@/app/(app)/presskit/presskit-schema';

export type CreateKitInput = z.input<typeof presskitSchema>;
