import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { lookupChord } from '../../lib/chordpro/chordLookup';
import { PianoChordDiagram } from './PianoChordDiagram';
import { GuitarChordDiagram } from './GuitarChordDiagram';
import { usePlayerStore } from '../../stores/playerStore';

interface ChordDiagramModalProps {
  visible: boolean;
  chordName: string | null;
  onClose: () => void;
}

export function ChordDiagramModal({ visible, chordName, onClose }: ChordDiagramModalProps) {
  const { t } = useTranslation();
  const preferredInstrument = usePlayerStore((s) => s.preferredInstrument);
  const setPreferredInstrument = usePlayerStore((s) => s.setPreferredInstrument);

  if (!chordName) return null;

  const chord = lookupChord(chordName);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/60 justify-center items-center" onPress={onClose}>
        <Pressable className="bg-light-surface dark:bg-surface rounded-2xl mx-6 p-5 w-[320px]" onPress={(e) => e.stopPropagation()}>
          {/* Akor adı */}
          <Text className="text-light-text-primary dark:text-text-primary text-2xl font-bold text-center mb-4">
            {chordName}
          </Text>

          {/* Tab toggle */}
          <View className="flex-row bg-light-surface-2 dark:bg-surface-2 rounded-xl p-1 mb-4">
            <TouchableOpacity
              onPress={() => setPreferredInstrument('guitar')}
              className={`flex-1 py-2 rounded-lg items-center ${
                preferredInstrument === 'guitar' ? 'bg-primary' : ''
              }`}
            >
              <Text className={`text-sm font-medium ${
                preferredInstrument === 'guitar' ? 'text-white' : 'text-light-text-secondary dark:text-text-secondary'
              }`}>
                {t('chords.guitar')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPreferredInstrument('piano')}
              className={`flex-1 py-2 rounded-lg items-center ${
                preferredInstrument === 'piano' ? 'bg-primary' : ''
              }`}
            >
              <Text className={`text-sm font-medium ${
                preferredInstrument === 'piano' ? 'text-white' : 'text-light-text-secondary dark:text-text-secondary'
              }`}>
                {t('chords.piano')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Diyagram */}
          <View className="items-center min-h-[100px] justify-center">
            {preferredInstrument === 'guitar' ? (
              chord.guitar ? (
                <GuitarChordDiagram data={chord.guitar} />
              ) : (
                <Text className="text-light-text-muted dark:text-text-muted text-sm">{t('chords.notAvailable')}</Text>
              )
            ) : (
              chord.piano ? (
                <PianoChordDiagram keys={chord.piano} />
              ) : (
                <Text className="text-light-text-muted dark:text-text-muted text-sm">{t('chords.notAvailable')}</Text>
              )
            )}
          </View>

          {/* Kapat */}
          <TouchableOpacity onPress={onClose} className="mt-4 py-2 items-center">
            <Text className="text-primary font-medium">{t('common.done')}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
