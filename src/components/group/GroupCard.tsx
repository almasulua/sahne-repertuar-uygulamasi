import React from 'react';
import { View, Text } from 'react-native';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import type { GroupWithMembers } from '../../types/group';

interface GroupCardProps {
  group: GroupWithMembers;
  onPress?: () => void;
}

const ROLE_VARIANT = {
  owner: 'primary',
  admin: 'info',
  member: 'neutral',
} as const;

function GroupCardImpl({ group, onPress }: GroupCardProps) {
  return (
    <Card onPress={onPress} className="mb-3">
      <View className="flex-row items-center">
        <Avatar uri={group.avatar_url} name={group.name} size="md" />
        <View className="flex-1 ml-3">
          <View className="flex-row items-center gap-2">
            <Text className="text-light-text-primary dark:text-text-primary font-semibold text-base flex-1" numberOfLines={1}>
              {group.name}
            </Text>
            {group.my_role && (
              <Badge
                label={group.my_role}
                variant={ROLE_VARIANT[group.my_role]}
              />
            )}
          </View>
          {group.description && (
            <Text className="text-light-text-secondary dark:text-text-secondary text-sm mt-0.5" numberOfLines={1}>
              {group.description}
            </Text>
          )}
          <View className="flex-row items-center mt-1 gap-2">
            {group.genre && (
              <Text className="text-light-text-muted dark:text-text-muted text-xs">{group.genre}</Text>
            )}
            <Text className="text-light-text-muted dark:text-text-muted text-xs">
              {group.member_count > 0
                ? `${group.member_count} üye`
                : group.members?.length > 0
                ? `${group.members.length} üye`
                : ''}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

export const GroupCard = React.memo(GroupCardImpl, (prev, next) =>
  prev.group.id === next.group.id &&
  prev.group.name === next.group.name &&
  prev.group.avatar_url === next.group.avatar_url &&
  prev.group.description === next.group.description &&
  prev.group.member_count === next.group.member_count &&
  prev.group.my_role === next.group.my_role,
);
