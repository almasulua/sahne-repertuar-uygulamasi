import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightAction?: { icon: React.ReactNode; onPress: () => void };
  required?: boolean;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  rightAction,
  required,
  style,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);

  const borderClass = error
    ? 'border-error'
    : focused
    ? 'border-primary'
    : 'border-light-border dark:border-border';

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-light-text-secondary dark:text-text-secondary text-sm font-medium mb-1.5">
          {label}
          {required && <Text className="text-error"> *</Text>}
        </Text>
      )}
      <View
        className={[
          'flex-row items-center bg-light-surface-2 dark:bg-surface-2 rounded-xl border px-4',
          borderClass,
          focused ? 'border-2' : 'border',
        ].join(' ')}
      >
        {leftIcon && <View className="mr-2">{leftIcon}</View>}
        <TextInput
          className="flex-1 text-light-text-primary dark:text-text-primary text-base py-3"
          placeholderTextColor="#9E9E9E"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={style}
          {...rest}
        />
        {(rightIcon || rightAction) && (
          <View className="ml-2">
            {rightAction ? (
              <TouchableOpacity onPress={rightAction.onPress}>
                {rightAction.icon}
              </TouchableOpacity>
            ) : (
              rightIcon
            )}
          </View>
        )}
      </View>
      {error && <Text className="text-error text-xs mt-1">{error}</Text>}
      {hint && !error && <Text className="text-light-text-muted dark:text-text-muted text-xs mt-1">{hint}</Text>}
    </View>
  );
}
