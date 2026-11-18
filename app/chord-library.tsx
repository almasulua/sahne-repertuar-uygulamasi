import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GUITAR_CHORDS } from '../src/lib/chordpro/chordData';
import { ChordDiagramModal } from '../src/components/song/ChordDiagramModal';
import { parseChordName } from '../src/lib/chordpro/transposer';
import { listPerfProps } from '../src/lib/listPerf';

const CHORD_ROW_HEIGHT = 64; // py-4 (32) + text-lg (~24) + marginBottom (8)

type FilterKey = 'all' | 'major' | 'minor' | '7' | 'm7' | 'maj7' | 'sus' | 'dim';

// labelKey verilenler i18n'den çevrilir; akor sembolleri (7, m7, maj7, ...) evrensel notasyon olduğu için literal kalır.
const FILTERS: { key: FilterKey; label: string; labelKey?: string }[] = [
  { key: 'all', label: 'Tümü', labelKey: 'chordLibrary.filter.all' },
  { key: 'major', label: 'Majör', labelKey: 'chordLibrary.filter.major' },
  { key: 'minor', label: 'Minör', labelKey: 'chordLibrary.filter.minor' },
  { key: '7', label: '7' },
  { key: 'm7', label: 'm7' },
  { key: 'maj7', label: 'maj7' },
  { key: 'sus', label: 'sus' },
  { key: 'dim', label: 'dim' },
];

function chordMatchesFilter(name: string, filter: FilterKey): boolean {
  if (filter === 'all') return true;
  const parts = parseChordName(name);
  const q = parts?.quality ?? '';
  switch (filter) {
    case 'major':
      return q === '';
    case 'minor':
      return /^m(?!aj)/.test(q);
    case '7':
      return q === '7';
    case 'm7':
      return q === 'm7';
    case 'maj7':
      return /^maj7/.test(q);
    case 'sus':
      return /^sus/.test(q);
    case 'dim':
      return /^dim/.test(q);
    default:
      return true;
  }
}

export default function ChordLibraryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [selected, setSelected] = useState<string | null>(null);

  const allChords = useMemo(() => Object.keys(GUITAR_CHORDS).sort(), []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allChords.filter((name) => {
      if (q && !name.toLowerCase().includes(q)) return false;
      return chordMatchesFilter(name, filter);
    });
  }, [allChords, search, filter]);

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-4 pb-2">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-primary text-xl">←</Text>
        </TouchableOpacity>
        <Text className="text-light-text-primary dark:text-text-primary text-xl font-bold flex-1">
          {t('chordLibrary.title', 'Akor Kütüphanesi')}
        </Text>
        <Text className="text-light-text-muted dark:text-text-muted text-xs">{filtered.length}</Text>
      </View>

      {/* Arama */}
      <View className="mx-4 mb-3">
        <TextInput
          className="bg-light-surface-2 dark:bg-surface-2 rounded-xl px-4 py-2.5 text-light-text-primary dark:text-text-primary border border-light-border dark:border-border"
          placeholder={t('chordLibrary.searchPlaceholder', 'Akor ara (örn. Am, C7, Fmaj7)')}
          placeholderTextColor="#9E9E9E"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Filtreler */}
      <View className="mb-2">
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(o) => o.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setFilter(item.key)}
              className={`px-3 py-1.5 rounded-full border ${
                filter === item.key
                  ? 'bg-primary border-primary'
                  : 'border-light-border-light dark:border-border-light bg-light-surface-2 dark:bg-surface-2'
              }`}
            >
              <Text
                className={`text-sm ${
                  filter === item.key ? 'text-white font-semibold' : 'text-light-text-secondary dark:text-text-secondary'
                }`}
              >
                {item.labelKey ? t(item.labelKey, item.label) : item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Akor Grid */}
      <FlatList
        {...listPerfProps}
        data={filtered}
        keyExtractor={(name) => name}
        numColumns={4}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 32 }}
        columnWrapperStyle={{ gap: 8, marginBottom: 8 }}
        getItemLayout={(_, index) => ({
          length: CHORD_ROW_HEIGHT,
          offset: CHORD_ROW_HEIGHT * Math.floor(index / 4),
          index,
        })}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelected(item)}
            className="flex-1 bg-light-surface-2 dark:bg-surface-2 rounded-xl py-4 items-center border border-light-border dark:border-border"
          >
            <Text className="text-light-text-primary dark:text-text-primary text-lg font-semibold">{item}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="py-16 items-center">
            <Text className="text-light-text-muted dark:text-text-muted">
              {t('chordLibrary.noResults', 'Sonuç bulunamadı')}
            </Text>
          </View>
        }
      />

      <ChordDiagramModal
        visible={selected !== null}
        chordName={selected}
        onClose={() => setSelected(null)}
      />
    </SafeAreaView>
  );
}
