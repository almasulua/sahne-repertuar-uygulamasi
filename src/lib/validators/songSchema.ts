import { z } from 'zod';

export const songSchema = z.object({
  title: z.string().min(1, 'Şarkı adı zorunludur').max(200),
  artist: z.string().max(200).optional(),
  genre: z.array(z.string()).default([]),
  key: z.string().max(10).optional(),
  bpm: z.number().int().min(1).max(400).optional(),
  duration: z.number().int().min(0).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  lyrics: z.string().optional(),
  source_url: z.string().url('Geçerli bir URL giriniz').optional().or(z.literal('')),
});

export const personalSongSchema = z.object({
  notes: z.string().max(2000).optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(['learning', 'ready', 'archived']).default('learning'),
  is_favorite: z.boolean().default(false),
});

export const createSongSchema = songSchema.merge(personalSongSchema);

export type SongFormValues = z.infer<typeof songSchema>;
export type SongFormInput = z.input<typeof songSchema>;
export type PersonalSongFormValues = z.infer<typeof personalSongSchema>;
export type CreateSongFormValues = z.infer<typeof createSongSchema>;
export type CreateSongFormInput = z.input<typeof createSongSchema>;
