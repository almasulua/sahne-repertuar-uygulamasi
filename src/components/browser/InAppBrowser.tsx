import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useTranslation } from 'react-i18next';
import { EXTRACT_CONTENT_JS } from '../../lib/scraper/injectedJs';

interface InAppBrowserProps {
  initialUrl?: string;
  onContentExtracted: (data: { title: string; content: string; url: string }) => void;
}

export function InAppBrowser({ initialUrl, onContentExtracted }: InAppBrowserProps) {
  const { t } = useTranslation();
  const webViewRef = useRef<WebView>(null);
  const [url, setUrl] = useState(initialUrl ?? '');
  const [currentUrl, setCurrentUrl] = useState(initialUrl ?? '');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigateTo = () => {
    let target = url.trim();
    if (!target) return;
    // URL gibi görünmüyorsa Google araması yap
    const looksLikeUrl = /^(https?:\/\/|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})/.test(target);
    if (!looksLikeUrl) {
      target = `https://www.google.com/search?q=${encodeURIComponent(target)}`;
    } else if (!target.startsWith('http')) {
      target = `https://${target}`;
    }
    setCurrentUrl(target);
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'content') {
        onContentExtracted(data);
      }
    } catch {
      // ignore parse errors
    }
  };

  const extractContent = () => {
    webViewRef.current?.injectJavaScript(EXTRACT_CONTENT_JS);
  };

  return (
    <View className="flex-1">
      {/* Adres çubuğu */}
      <View className="flex-row items-center px-2 py-2 bg-light-surface dark:bg-surface border-b border-light-border dark:border-border gap-1">
        <TouchableOpacity
          onPress={() => webViewRef.current?.goBack()}
          disabled={!canGoBack}
          className="p-2"
        >
          <Text className={`text-lg ${canGoBack ? 'text-primary' : 'text-light-text-muted dark:text-text-muted'}`}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => webViewRef.current?.goForward()}
          disabled={!canGoForward}
          className="p-2"
        >
          <Text className={`text-lg ${canGoForward ? 'text-primary' : 'text-light-text-muted dark:text-text-muted'}`}>→</Text>
        </TouchableOpacity>
        <TextInput
          className="flex-1 bg-light-surface-2 dark:bg-surface-2 rounded-lg px-3 py-1.5 text-light-text-primary dark:text-text-primary text-sm"
          value={url}
          onChangeText={setUrl}
          onSubmitEditing={navigateTo}
          placeholder="https://..."
          placeholderTextColor="#9E9E9E"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        <TouchableOpacity
          onPress={() => webViewRef.current?.reload()}
          className="p-2"
        >
          <Text className="text-primary text-sm">↻</Text>
        </TouchableOpacity>
      </View>

      {/* WebView */}
      {currentUrl ? (
        <>
          <WebView
            ref={webViewRef}
            source={{ uri: currentUrl }}
            onNavigationStateChange={(state) => {
              setUrl(state.url);
              setCanGoBack(state.canGoBack);
              setCanGoForward(state.canGoForward);
              setError(null);
            }}
            onMessage={handleMessage}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              setError(nativeEvent.description || 'Sayfa yüklenemedi');
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              if (nativeEvent.statusCode >= 400) {
                setError(`HTTP ${nativeEvent.statusCode}`);
              }
            }}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
          />
          {error && (
            <View className="absolute inset-0 top-0 items-center justify-center bg-light-background/95 dark:bg-background/95">
              <Text className="text-error text-base mb-2">{error}</Text>
              <TouchableOpacity
                onPress={() => { setError(null); webViewRef.current?.reload(); }}
                className="bg-primary px-4 py-2 rounded-lg"
              >
                <Text className="text-white text-sm">{t('common.retry')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      ) : (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-light-text-muted dark:text-text-muted text-center mb-4">{t('browser.enterUrl')}</Text>
          <Text className="text-light-text-muted dark:text-text-muted text-xs text-center">
            akorlar.com, tab.com veya aranacak kelimeyi yazın
          </Text>
        </View>
      )}

      {/* FAB: Akor Çek */}
      {currentUrl && (
        <TouchableOpacity
          onPress={extractContent}
          className="absolute bottom-6 right-4 bg-primary w-14 h-14 rounded-full items-center justify-center shadow-lg"
        >
          <Text className="text-white text-xl">🎵</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
