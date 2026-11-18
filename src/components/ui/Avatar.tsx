import React from 'react';
import { View, Text } from 'react-native';
import Constants from 'expo-constants';

// Expo Go'da expo-image native modülü olmayabilir → fallback için RN Image.
// Constants.appOwnership === 'expo' guard'ı, RecordingPanel/Notifications pattern'ı.
function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

type ExpoImageModule = typeof import('expo-image');
let ExpoImage: ExpoImageModule | null = null;
if (!isExpoGo()) {
  try {
    ExpoImage = require('expo-image') as ExpoImageModule;
  } catch {
    ExpoImage = null;
  }
}

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const SIZE_CONFIG = {
  xs: { container: 'w-7 h-7', text: 'text-xs' },
  sm: { container: 'w-9 h-9', text: 'text-sm' },
  md: { container: 'w-11 h-11', text: 'text-base' },
  lg: { container: 'w-14 h-14', text: 'text-lg' },
  xl: { container: 'w-20 h-20', text: 'text-2xl' },
};

function AvatarImpl({ uri, name, size = 'md' }: AvatarProps) {
  const { container, text } = SIZE_CONFIG[size];
  const initials = name
    ? name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  if (uri) {
    return (
      <View className={`${container} rounded-full overflow-hidden bg-light-surface-2 dark:bg-surface-2`}>
        {ExpoImage ? (
          <ExpoImage.Image
            source={{ uri }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
            recyclingKey={uri}
          />
        ) : (
          // Fallback: react-native Image (Expo Go veya modül yüklenemediği durumda).
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          (() => {
            const { Image } = require('react-native');
            return <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />;
          })()
        )}
      </View>
    );
  }

  return (
    <View className={`${container} rounded-full bg-primary items-center justify-center`}>
      <Text className={`${text} text-white font-semibold`}>{initials}</Text>
    </View>
  );
}

export const Avatar = React.memo(AvatarImpl, (prev, next) =>
  prev.uri === next.uri && prev.name === next.name && prev.size === next.size,
);
