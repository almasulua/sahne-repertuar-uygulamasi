import React from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ToastContainer } from '../ui/Toast';

interface ScreenProps extends ViewProps {
  scrollable?: boolean;
  withPadding?: boolean;
  withSafeArea?: boolean;
  keyboardAvoiding?: boolean;
}

export function Screen({
  children,
  scrollable = false,
  withPadding = true,
  withSafeArea = true,
  keyboardAvoiding = false,
  className,
  ...rest
}: ScreenProps) {
  const Container = withSafeArea ? SafeAreaView : View;
  const paddingClass = withPadding ? 'px-4' : '';

  const inner = scrollable ? (
    <ScrollView
      className={`flex-1 ${paddingClass}`}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View className={`flex-1 ${paddingClass}`} {...rest}>
      {children}
    </View>
  );

  const content = (
    <Container className={`flex-1 bg-light-background dark:bg-background ${className ?? ''}`}>
      {inner}
      <ToastContainer />
    </Container>
  );

  if (keyboardAvoiding) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }

  return content;
}
