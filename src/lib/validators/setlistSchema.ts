import { z } from 'zod';

export const setlistSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  event_date: z.string().optional(),
  venue: z.string().max(200).optional(),
});

export const setlistItemSchema = z.object({
  song_id: z.string().uuid().nullable().optional(),
  item_type: z.enum(['song', 'break']).default('song'),
  notes: z.string().max(500).optional(),
  custom_key: z.string().max(10).optional(),
  custom_bpm: z.number().int().min(1).max(400).optional(),
  break_duration: z.number().int().min(1).max(120).optional(),
});

export type SetlistFormData = z.infer<typeof setlistSchema>;
export type SetlistItemFormData = z.infer<typeof setlistItemSchema>;
