import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { captureException } from '../lib/sentry';

interface Props {
  children: React.ReactNode;
  /** Reset edildiğinde children unmount + remount edilir. Üst tarafta key prop'u ile kullanılabilir. */
  fallback?: (props: { error: Error; reset: () => void }) => React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Uygulamanın herhangi bir yerinde yakalanmamış bir render hatası olursa
 * tüm ağacın crash'lemesini önler, Sentry'ye bildirir, kullanıcıya retry sunar.
 *
 * Sadece **render** hataları yakalar — async hatalar için unhandled rejection
 * handler ayrı kurulur (lib/errorHandler.ts).
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    captureException(error, { componentStack: info.componentStack });
    if (__DEV__) {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): React.ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback({ error, reset: this.reset });
    }

    return <DefaultErrorScreen error={error} onReset={this.reset} />;
  }
}

function DefaultErrorScreen({ error, onReset }: { error: Error; onReset: () => void }) {
  return (
    <View
      style={{ flex: 1, backgroundColor: '#0f0f0f', padding: 24, justifyContent: 'center' }}
    >
      <Text style={{ fontSize: 56, textAlign: 'center', marginBottom: 16 }}>🛠️</Text>
      <Text
        style={{
          color: '#fafafa',
          fontSize: 22,
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: 8,
        }}
      >
        Bir şeyler ters gitti
      </Text>
      <Text
        style={{
          color: '#a1a1aa',
          fontSize: 14,
          textAlign: 'center',
          marginBottom: 24,
          lineHeight: 20,
        }}
      >
        Beklenmedik bir hata oluştu. Geliştirici ekip otomatik olarak bilgilendirildi.
      </Text>

      {__DEV__ ? (
        <ScrollView
          style={{
            maxHeight: 200,
            backgroundColor: '#18181b',
            borderRadius: 8,
            padding: 12,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: '#27272a',
          }}
        >
          <Text style={{ color: '#ef4444', fontFamily: 'monospace', fontSize: 11 }}>
            {error.message}
          </Text>
          {error.stack ? (
            <Text style={{ color: '#71717a', fontFamily: 'monospace', fontSize: 10, marginTop: 8 }}>
              {error.stack.split('\n').slice(0, 8).join('\n')}
            </Text>
          ) : null}
        </ScrollView>
      ) : null}

      <TouchableOpacity
        onPress={onReset}
        style={{
          backgroundColor: '#a78bfa',
          paddingVertical: 14,
          borderRadius: 12,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Yeniden Dene</Text>
      </TouchableOpacity>
    </View>
  );
}
