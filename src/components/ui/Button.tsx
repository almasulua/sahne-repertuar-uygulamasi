import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  label: string;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-light-surface-2 dark:bg-surface-2 border border-light-border-light dark:border-border-light',
  outline: 'border border-primary',
  ghost: 'bg-transparent',
  danger: 'bg-error',
};

const VARIANT_TEXT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-light-text-primary dark:text-text-primary',
  outline: 'text-primary',
  ghost: 'text-light-text-secondary dark:text-text-secondary',
  danger: 'text-white',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'py-2 px-3 rounded-lg',
  md: 'py-3 px-5 rounded-xl',
  lg: 'py-4 px-6 rounded-2xl',
};

const SIZE_TEXT_CLASSES: Record<ButtonSize, string> = {
  sm: 'text-sm font-medium',
  md: 'text-base font-semibold',
  lg: 'text-lg font-semibold',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  label,
  disabled,
  onPress,
  className,
  ...rest
}: ButtonProps) {
  const handlePress = (event: Parameters<NonNullable<typeof onPress>>[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress?.(event);
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isDisabled}
      className={[
        'flex-row items-center justify-center',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth ? 'w-full' : 'self-start',
        isDisabled ? 'opacity-50' : 'opacity-100',
        className ?? '',
      ].join(' ')}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? '#fff' : '#6C63FF'}
        />
      ) : (
        <>
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
          <Text className={[VARIANT_TEXT_CLASSES[variant], SIZE_TEXT_CLASSES[size]].join(' ')}>
            {label}
          </Text>
          {rightIcon && <View className="ml-2">{rightIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
}
