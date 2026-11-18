import { z } from 'zod';

export const eventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  event_date: z.string().min(1),
  end_date: z.string().optional(),
  venue: z.string().max(200).optional(),
  venue_address: z.string().max(500).optional(),
  setlist_id: z.string().uuid().optional(),
});

export type EventFormData = z.infer<typeof eventSchema>;
