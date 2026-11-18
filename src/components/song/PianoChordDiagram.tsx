import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';

interface PianoChordDiagramProps {
  keys: number[]; // 0-23 arası basılı tuş indeksleri (2 oktav)
  width?: number;
}

const WHITE_KEYS = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23]; // C D E F G A B (2 oktav)
const BLACK_KEYS = [1, 3, 6, 8, 10, 13, 15, 18, 20, 22]; // C# D# F# G# A# (2 oktav)

// Siyah tuş pozisyonları (beyaz tuş indeksine göre)
const BLACK_KEY_POSITIONS: Record<number, number> = {
  1: 0.7, 3: 1.7, 6: 3.7, 8: 4.7, 10: 5.7,
  13: 7.7, 15: 8.7, 18: 10.7, 20: 11.7, 22: 12.7,
};

export function PianoChordDiagram({ keys, width = 280 }: PianoChordDiagramProps) {
  const whiteKeyWidth = width / 14;
  const blackKeyWidth = whiteKeyWidth * 0.6;
  const whiteKeyHeight = 80;
  const blackKeyHeight = 50;

  const pressedSet = new Set(keys);

  return (
    <View className="items-center">
      <Svg width={width} height={whiteKeyHeight + 4}>
        {/* Beyaz tuşlar */}
        {WHITE_KEYS.map((noteIdx, i) => {
          const isPressed = pressedSet.has(noteIdx);
          return (
            <Rect
              key={`w-${noteIdx}`}
              x={i * whiteKeyWidth}
              y={0}
              width={whiteKeyWidth - 1}
              height={whiteKeyHeight}
              fill={isPressed ? '#6366f1' : '#ffffff'}
              stroke="#333"
              strokeWidth={1}
              rx={2}
            />
          );
        })}
        {/* Siyah tuşlar */}
        {BLACK_KEYS.map((noteIdx) => {
          const pos = BLACK_KEY_POSITIONS[noteIdx];
          if (pos === undefined) return null;
          const isPressed = pressedSet.has(noteIdx);
          return (
            <Rect
              key={`b-${noteIdx}`}
              x={pos * whiteKeyWidth + (whiteKeyWidth - blackKeyWidth) / 2}
              y={0}
              width={blackKeyWidth}
              height={blackKeyHeight}
              fill={isPressed ? '#818cf8' : '#1a1a1a'}
              stroke="#333"
              strokeWidth={1}
              rx={2}
            />
          );
        })}
      </Svg>
    </View>
  );
}
