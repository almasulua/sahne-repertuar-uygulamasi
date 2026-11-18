import { z } from 'zod';

export const groupSchema = z.object({
  name: z.string().min(2, 'Grup adı en az 2 karakter olmalıdır').max(100),
  description: z.string().max(500).optional(),
  genre: z.string().max(100).optional(),
});

export type GroupFormValues = z.infer<typeof groupSchema>;
