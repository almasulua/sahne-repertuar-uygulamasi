import { useQuery } from '@tanstack/react-query';
import { activitiesApi } from '../api/activities';

export const ACTIVITY_KEYS = {
  byGroup: (groupId: string) => ['group-activities', groupId] as const,
};

export function useGroupActivities(groupId: string | null, limit: number = 50) {
  return useQuery({
    queryKey: ACTIVITY_KEYS.byGroup(groupId ?? ''),
    queryFn: () => activitiesApi.getByGroup(groupId!, limit),
    enabled: !!groupId,
  });
}
