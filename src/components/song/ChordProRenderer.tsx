import React, { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { parseChordPro } from '../../lib/chordpro/parser';
import { transposeChordPro } from '../../lib/chordpro/transposer';
import type { ChordProLine } from '../../types/song';

interface ChordProRendererProps {
  source: string;
  transposeSteps?: number;
  fontSize?: number;
  showChordsOnly?: boolean;
  onChordPress?: (chord: string) => void;
}

/** Tek bir chord-text çiftini render eder */
function ChordTextPairView({
  chord,
  text,
  fontSize,
  onChordPress,
}: {
  chord: string | null;
  text: string;
  fontSize: number;
  onChordPress?: (chord: string) => void;
}) {
  return (
    <View className="items-start mr-1">
      <Text
        className="text-primary font-bold"
        style={{ fontSize: fontSize - 2, minHeight: fontSize, lineHeight: fontSize }}
        onPress={chord ? () => onChordPress?.(chord) : undefined}
      >
        {chord ?? ' '}
      </Text>
      <Text className="text-light-text-primary dark:text-text-primary" style={{ fontSize, lineHeight: fontSize * 1.5 }}>
        {text || ' '}
      </Text>
    </View>
  );
}

/** Direktif satırı (title, key, capo vb.) */
function DirectiveLine({
  line,
  fontSize,
}: {
  line: ChordProLine;
  fontSize: number;
}) {
  const key = line.directiveKey?.toLowerCase();

  if (key === 'title') {
    return (
      <Text
        className="text-light-text-primary dark:text-text-primary font-bold text-center mb-1"
        style={{ fontSize: fontSize + 4 }}
      >
        {line.directiveValue}
      </Text>
    );
  }

  if (key === 'artist' || key === 'subtitle') {
    return (
      <Text
        className="text-light-text-secondary dark:text-text-secondary text-center mb-3"
        style={{ fontSize }}
      >
        {line.directiveValue}
      </Text>
    );
  }

  if (key === 'comment' || key === 'c') {
    return (
      <View className="bg-light-surface-2 dark:bg-surface-2 rounded-lg px-3 py-1.5 my-1">
        <Text className="text-light-text-secondary dark:text-text-secondary italic" style={{ fontSize: fontSize - 1 }}>
          {line.directiveValue}
        </Text>
      </View>
    );
  }

  if (key === 'start_of_chorus' || key === 'soc') {
    return <View className="w-full h-px bg-primary/30 my-2" />;
  }

  if (key === 'end_of_chorus' || key === 'eoc') {
    return <View className="w-full h-px bg-primary/30 my-2" />;
  }

  // Diğer direktifleri gizle
  return null;
}

/** Lyric satırını "tab text"e dönüştürür ([chord] notasyonunu korur) */
function lineToTabString(line: ChordProLine): string {
  return line.pairs
    .map((p) => (p.chord ? `[${p.chord}]${p.text}` : p.text))
    .join('');
}

/** Tab bloğu — monospace render */
function TabBlock({ lines, fontSize }: { lines: string[]; fontSize: number }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="bg-light-surface-2 dark:bg-surface-2 rounded-lg my-2"
    >
      <View className="px-3 py-2">
        {lines.map((l, i) => (
          <Text
            key={i}
            className="text-light-text-primary dark:text-text-primary font-mono"
            style={{ fontSize: fontSize - 2, lineHeight: (fontSize - 2) * 1.4 }}
          >
            {l || ' '}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

/** Ana render bileşeni */
export function ChordProRenderer({
  source,
  transposeSteps = 0,
  fontSize = 16,
  showChordsOnly = false,
  onChordPress,
}: ChordProRendererProps) {
  const lines = useMemo(() => {
    const transposed = transposeSteps !== 0
      ? transposeChordPro(source, transposeSteps)
      : source;
    return parseChordPro(transposed);
  }, [source, transposeSteps]);

  // Tab blokları start_of_tab/end_of_tab arası satırları monospace render eder.
  // Diğer satırlar normal lyric/chord pair render'ına gider.
  const elements: React.ReactNode[] = [];
  let tabBuffer: string[] | null = null;

  const flushTab = (key: string | number) => {
    if (tabBuffer) {
      elements.push(<TabBlock key={`tab-${key}`} lines={tabBuffer} fontSize={fontSize} />);
      tabBuffer = null;
    }
  };

  lines.forEach((line, lineIdx) => {
    if (line.isDirective) {
      const dKey = line.directiveKey?.toLowerCase();
      if (dKey === 'start_of_tab' || dKey === 'sot') {
        flushTab(`pre-${lineIdx}`);
        tabBuffer = [];
        return;
      }
      if (dKey === 'end_of_tab' || dKey === 'eot') {
        flushTab(lineIdx);
        return;
      }
      // Tab içindeysek diğer direktifleri tab string'i olarak tut (nadir)
      if (tabBuffer !== null) return;

      elements.push(<DirectiveLine key={lineIdx} line={line} fontSize={fontSize} />);
      return;
    }

    // Tab bloğu içinde — satırı string olarak topla
    if (tabBuffer !== null) {
      tabBuffer.push(lineToTabString(line));
      return;
    }

    if (line.pairs.length === 0) {
      elements.push(<View key={lineIdx} style={{ height: fontSize }} />);
      return;
    }

    if (showChordsOnly) {
      const chords = line.pairs.map((p) => p.chord).filter(Boolean);
      if (chords.length === 0) return;
      elements.push(
        <Text key={lineIdx} className="text-primary font-mono" style={{ fontSize }}>
          {chords.join('  ')}
        </Text>
      );
      return;
    }

    elements.push(
      <View key={lineIdx} className="flex-row flex-wrap mb-1">
        {line.pairs.map((pair, pairIdx) => (
          <ChordTextPairView
            key={pairIdx}
            chord={pair.chord}
            text={pair.text}
            fontSize={fontSize}
            onChordPress={onChordPress}
          />
        ))}
      </View>
    );
  });

  // Kapanmamış tab block'u kapat
  flushTab('end');

  return <View className="py-4">{elements}</View>;
}
