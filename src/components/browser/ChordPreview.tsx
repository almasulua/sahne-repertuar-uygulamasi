import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { convertToChordPro, stripHtml } from '../../lib/scraper/htmlToChordPro';
import { ChordProRenderer } from '../song/ChordProRenderer';

interface ChordPreviewProps {
  rawContent: string;
  pageTitle: string;
  sourceUrl: string;
  onSave: (data: { title: string; artist: string; lyrics: string; source_url: string }) => void;
}

export function ChordPreview({ rawContent, pageTitle, sourceUrl, onSave }: ChordPreviewProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(pageTitle);
  const [artist, setArtist] = useState('');
  const [showPreview, setShowPreview] = useState(true);

  const chordPro = useMemo(() => {
    const plainText = stripHtml(rawContent);
    return convertToChordPro(plainText);
  }, [rawContent]);

  const [editedLyrics, setEditedLyrics] = useState(chordPro);

  return (
    <View className="flex-1 bg-light-background dark:bg-background">
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Meta */}
        <Text className="text-light-text-secondary dark:text-text-secondary text-sm font-medium mt-4 mb-1">{t('repertoire.songTitle')}</Text>
        <TextInput
          className="bg-light-surface-2 dark:bg-surface-2 rounded-xl px-4 py-2.5 text-light-text-primary dark:text-text-primary text-base mb-3 border border-light-border dark:border-border"
          value={title}
          onChangeText={setTitle}
        />

        <Text className="text-light-text-secondary dark:text-text-secondary text-sm font-medium mb-1">{t('repertoire.artist')}</Text>
        <TextInput
          className="bg-light-surface-2 dark:bg-surface-2 rounded-xl px-4 py-2.5 text-light-text-primary dark:text-text-primary text-base mb-3 border border-light-border dark:border-border"
          value={artist}
          onChangeText={setArtist}
          placeholder={t('repertoire.artist')}
          placeholderTextColor="#9E9E9E"
        />

        {/* Toggle: Önizleme / Düzenle */}
        <View className="flex-row bg-light-surface-2 dark:bg-surface-2 rounded-xl p-1 mb-3">
          <TouchableOpacity
            onPress={() => setShowPreview(true)}
            className={`flex-1 py-2 rounded-lg items-center ${showPreview ? 'bg-primary' : ''}`}
          >
            <Text className={`text-sm ${showPreview ? 'text-white' : 'text-light-text-secondary dark:text-text-secondary'}`}>
              {t('browser.preview')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowPreview(false)}
            className={`flex-1 py-2 rounded-lg items-center ${!showPreview ? 'bg-primary' : ''}`}
          >
            <Text className={`text-sm ${!showPreview ? 'text-white' : 'text-light-text-secondary dark:text-text-secondary'}`}>
              {t('common.edit')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* İçerik */}
        {showPreview ? (
          <ChordProRenderer source={editedLyrics} fontSize={14} />
        ) : (
          <TextInput
            className="bg-light-surface-2 dark:bg-surface-2 rounded-xl px-4 py-3 text-light-text-primary dark:text-text-primary text-sm font-mono min-h-[300px] border border-light-border dark:border-border"
            value={editedLyrics}
            onChangeText={setEditedLyrics}
            multiline
            textAlignVertical="top"
          />
        )}

        <View className="h-24" />
      </ScrollView>

      {/* Kaydet */}
      <View className="px-4 pb-6 pt-2 bg-light-background dark:bg-background border-t border-light-border dark:border-border">
        <TouchableOpacity
          onPress={() =>
            onSave({
              title: title.trim() || 'Untitled',
              artist: artist.trim(),
              lyrics: editedLyrics,
              source_url: sourceUrl,
            })
          }
          className="bg-primary py-3.5 rounded-xl items-center"
        >
          <Text className="text-white font-semibold">{t('browser.saveToRepertoire')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
