import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Line, Circle, Rect, Text as SvgText } from 'react-native-svg';

interface GuitarChordDiagramProps {
  data: {
    fingers: Array<[fret: number, string: number]>;
    barre?: { fret: number; from: number; to: number };
    openStrings: number[];
    mutedStrings: number[];
    baseFret: number;
  };
  width?: number;
}

export function GuitarChordDiagram({ data, width = 140 }: GuitarChordDiagramProps) {
  const padding = 20;
  const fretCount = 5;
  const stringCount = 6;
  const fretSpacing = (width - padding * 2) / (fretCount);
  const stringSpacing = (width - padding * 2) / (stringCount - 1);
  const height = fretSpacing * fretCount + padding * 2 + 16;

  const stringX = (s: number) => padding + (s - 1) * stringSpacing;
  const fretY = (f: number) => padding + 16 + (f - data.baseFret + 1) * fretSpacing;

  return (
    <View className="items-center">
      <Svg width={width} height={height}>
        {/* Base fret number */}
        {data.baseFret > 1 && (
          <SvgText x={6} y={fretY(data.baseFret) - fretSpacing / 2 + 4} fill="#999" fontSize={10}>
            {data.baseFret}
          </SvgText>
        )}

        {/* Nut (1. perde çizgisi) */}
        {data.baseFret === 1 && (
          <Rect x={padding - 1} y={padding + 14} width={stringSpacing * 5 + 2} height={3} fill="#fff" rx={1} />
        )}

        {/* Perde çizgileri */}
        {Array.from({ length: fretCount + 1 }, (_, i) => (
          <Line
            key={`fret-${i}`}
            x1={padding}
            y1={padding + 16 + i * fretSpacing}
            x2={padding + stringSpacing * 5}
            y2={padding + 16 + i * fretSpacing}
            stroke="#555"
            strokeWidth={1}
          />
        ))}

        {/* Tel çizgileri */}
        {Array.from({ length: stringCount }, (_, i) => (
          <Line
            key={`str-${i}`}
            x1={stringX(i + 1)}
            y1={padding + 16}
            x2={stringX(i + 1)}
            y2={padding + 16 + fretCount * fretSpacing}
            stroke="#888"
            strokeWidth={1}
          />
        ))}

        {/* Açık tel (O) ve kapalı tel (X) */}
        {data.openStrings.map((s) => (
          <Circle
            key={`open-${s}`}
            cx={stringX(s + 1)}
            cy={padding + 6}
            r={5}
            stroke="#6366f1"
            strokeWidth={1.5}
            fill="none"
          />
        ))}
        {data.mutedStrings.map((s) => (
          <SvgText
            key={`mute-${s}`}
            x={stringX(s + 1)}
            y={padding + 10}
            textAnchor="middle"
            fill="#999"
            fontSize={12}
          >
            ×
          </SvgText>
        ))}

        {/* Barre */}
        {data.barre && (
          <Rect
            x={stringX(data.barre.from) - 4}
            y={fretY(data.barre.fret) - fretSpacing / 2 - 5}
            width={stringX(data.barre.to) - stringX(data.barre.from) + 8}
            height={10}
            fill="#6366f1"
            rx={5}
          />
        )}

        {/* Parmak noktaları */}
        {data.fingers.map(([fret, string], i) => (
          <Circle
            key={`finger-${i}`}
            cx={stringX(string)}
            cy={fretY(fret + data.baseFret - 1) - fretSpacing / 2}
            r={7}
            fill="#6366f1"
          />
        ))}
      </Svg>
    </View>
  );
}
