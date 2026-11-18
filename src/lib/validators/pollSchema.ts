import { z } from 'zod';

export const pollSchema = z.object({
  question: z.string().min(1).max(500),
  poll_type: z.enum(['multiple_choice', 'yes_no']).default('multiple_choice'),
  options: z
    .array(z.object({ id: z.string(), text: z.string().min(1).max(200) }))
    .min(2)
    .max(10),
  expires_at: z.string().optional(),
  is_anonymous: z.boolean().default(false),
});

export type PollFormData = z.infer<typeof pollSchema>;
