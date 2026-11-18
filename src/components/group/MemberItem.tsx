import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import type { GroupMember } from '../../types/group';

interface MemberItemProps {
  member: GroupMember;
  onPress?: () => void;
  isCurrentUser?: boolean;
}

const ROLE_VARIANT = {
  owner: 'primary',
  admin: 'info',
  member: 'neutral',
} as const;

export function MemberItem({ member, onPress, isCurrentUser }: MemberItemProps) {
  const user = member.user;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center py-3 border-b border-light-border dark:border-border"
      disabled={!onPress}
    >
      <Avatar uri={user?.avatar_url} name={user?.display_name ?? user?.username} size="sm" />
      <View className="flex-1 ml-3">
        <Text className="text-light-text-primary dark:text-text-primary font-medium">
          {user?.display_name ?? user?.username ?? 'Bilinmeyen'}
          {isCurrentUser && ' (siz)'}
        </Text>
        {user?.username && (
          <Text className="text-light-text-muted dark:text-text-muted text-xs">@{user.username}</Text>
        )}
      </View>
      <Badge label={member.role} variant={ROLE_VARIANT[member.role]} />
    </TouchableOpacity>
  );
}
