import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSetlist } from '../../../../../../src/hooks/useSetlists';
import { StageView } from '../../../../../../src/components/setlist/StageView';
import { LoadingSpinner } from '../../../../../../src/components/ui/LoadingSpinner';

export default function StageScreen() {
  const { groupId, setlistId } = useLocalSearchParams<{ groupId: string; setlistId: string }>();
  const router = useRouter();
  const { data: setlist, isLoading } = useSetlist(setlistId ?? null);

  if (isLoading) return <LoadingSpinner fullscreen />;
  if (!setlist) return null;

  return (
    <View className="flex-1 bg-[#0a0a0a]">
      <StageView items={setlist.items} groupId={groupId!} onExit={() => router.back()} />
    </View>
  );
}
