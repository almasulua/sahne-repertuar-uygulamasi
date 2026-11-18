import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { useAuth } from './useAuth';
import { useAuthStore } from '../stores/authStore';
import type { User } from '../types/user';

export const PROFILE_QUERY_KEYS = {
  profile: (userId: string) => ['profile', userId] as const,
  publicProfile: (userId: string) => ['public-profile', userId] as const,
  search: (query: string) => ['user-search', query] as const,
  matches: (userId: string) => ['musician-matches', userId] as const,
};

/** Kullanıcı arama — debounce'lı (query 2+ karakter) */
export function useUserSearch(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: PROFILE_QUERY_KEYS.search(trimmed),
    queryFn: () => authApi.searchUsers(trimmed),
    enabled: trimmed.length >= 2,
    staleTime: 30_000,
  });
}

/** Başkasının public profilini çek (kendi profilinden ayrı cache) */
export function usePublicUser(userId: string | null) {
  return useQuery({
    queryKey: PROFILE_QUERY_KEYS.publicProfile(userId ?? ''),
    queryFn: () => authApi.getPublicProfile(userId!),
    enabled: !!userId,
  });
}

/** Kendi profilini çek */
export function useProfile() {
  const { user: storeUser } = useAuth();
  return useQuery({
    queryKey: PROFILE_QUERY_KEYS.profile(storeUser?.id ?? ''),
    queryFn: () => authApi.getProfile(storeUser!.id),
    enabled: !!storeUser,
    initialData: storeUser ?? undefined,
  });
}

/** Başkasının profilini çek */
export function useUserProfile(userId: string | null) {
  return useQuery({
    queryKey: PROFILE_QUERY_KEYS.profile(userId ?? ''),
    queryFn: () => authApi.getProfile(userId!),
    enabled: !!userId,
  });
}

/** Müzisyen eşleştirme — skorlu öneri listesi (find_musician_matches RPC) */
export function useMusicianMatches(limit: number = 20) {
  const { user } = useAuth();
  return useQuery({
    queryKey: PROFILE_QUERY_KEYS.matches(user?.id ?? ''),
    queryFn: () => authApi.findMusicianMatches(user!.id, limit),
    enabled: !!user,
    staleTime: 60_000, // 1dk — sık çağrılmasın
  });
}

/** Profil güncelle */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (updates: Partial<User>) => authApi.updateProfile(user!.id, updates),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.setQueryData(PROFILE_QUERY_KEYS.profile(user?.id ?? ''), updatedUser);
    },
  });
}
