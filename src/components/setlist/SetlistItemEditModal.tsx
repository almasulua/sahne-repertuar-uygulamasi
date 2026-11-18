import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useUpdateSetlistItem } from '../../hooks/useSetlists';
import { useGroup } from '../../hooks/useGroups';
import { Avatar } from '../ui/Avatar';
import type { SetlistItem } from '../../types/setlist';

interface Props {
  visible: boolean;
  item: SetlistItem | null;
  setlistId: string;
  groupId: string;
  onClose: () => void;
}

const PART_PRESETS = ['Vokal', 'Solo Gitar', 'Ritim Gitar', 'Bas', 'Davul', 'Klavye', 'Akustik'];

export function SetlistItemEditModal({ visible, item, setlistId, groupId, onClose }: Props) {
  const { t } = useTranslation();
  const update = useUpdateSetlistItem();
  const { data: group } = useGroup(groupId ?? null);

  const [notes, setNotes] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [customBpm, setCustomBpm] = useState('');
  const [breakDuration, setBreakDuration] = useState('');
  const [parts, setParts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!visible || !item) return;
    setNotes(item.notes ?? '');
    setCustomKey(item.custom_key ?? '');
    setCustomBpm(item.custom_bpm?.toString() ?? '');
    setBreakDuration(item.break_duration?.toString() ?? '');
    setParts(item.part_assignments ?? {});
  }, [visible, item]);

  const members = useMemo(() => group?.members ?? [], [group]);

  if (!item) return null;

  const isBreak = item.item_type === 'break';

  const handleSave = async () => {
    const bpmNum = customBpm.trim() ? parseInt(customBpm, 10) : NaN;
    const breakNum = breakDuration.trim() ? parseInt(breakDuration, 10) : NaN;

    // Boş part'ları temizle
    const cleanedParts: Record<string, string> = {};
    for (const [uid, role] of Object.entries(parts)) {
      const trimmed = role.trim();
      if (trimmed) cleanedParts[uid] = trimmed;
    }

    await update.mutateAsync({
      itemId: item.id,
      setlistId,
      notes: notes.trim() || null,
      custom_key: !isBreak && customKey.trim() ? customKey.trim() : null,
      custom_bpm: !isBreak && Number.isFinite(bpmNum) ? bpmNum : null,
      break_duration: isBreak && Number.isFinite(breakNum) ? breakNum : null,
      ...(isBreak ? {} : { part_assignments: cleanedParts }),
    });
    onClose();
  };

  const setPartFor = (userId: string, value: string) =>
    setParts((p) => ({ ...p, [userId]: value }));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 bg-black/60 justify-end">
          <SafeAreaView className="bg-light-surface dark:bg-surface rounded-t-3xl max-h-[90%]">
            <View className="flex-row items-center px-5 py-4 border-b border-light-border dark:border-border">
              <Text className="text-light-text-primary dark:text-text-primary text-lg font-bold flex-1">
                {isBreak
                  ? t('setlist.editBreak', 'Mola Düzenle')
                  : t('setlist.editItem', 'Şarkı Detayı Düzenle')}
              </Text>
              <TouchableOpacity onPress={onClose} className="px-2 py-1 mr-1">
                <Text className="text-light-text-secondary dark:text-text-secondary text-sm">{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                disabled={update.isPending}
                className="bg-primary px-3 py-1.5 rounded-lg"
              >
                <Text className="text-white text-sm font-semibold">{t('common.save')}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              className="px-5 py-4"
              contentContainerStyle={{ paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
            >
              {!isBreak && item.song && (
                <View className="bg-light-surface-2 dark:bg-surface-2 rounded-xl px-4 py-3 mb-4 border border-light-border dark:border-border">
                  <Text className="text-light-text-primary dark:text-text-primary font-semibold">{item.song.title}</Text>
                  {item.song.artist && (
                    <Text className="text-light-text-muted dark:text-text-muted text-xs">{item.song.artist}</Text>
                  )}
                </View>
              )}

              {isBreak ? (
                <>
                  <Text className="text-light-text-secondary dark:text-text-secondary text-sm font-medium mb-1">
                    {t('setlist.breakDuration', 'Mola süresi (dk)')}
                  </Text>
                  <TextInput
                    className="bg-light-surface-2 dark:bg-surface-2 rounded-xl px-4 py-3 text-light-text-primary dark:text-text-primary border border-light-border dark:border-border mb-4"
                    keyboardType="numeric"
                    placeholder="15"
                    placeholderTextColor="#9E9E9E"
                    value={breakDuration}
                    onChangeText={setBreakDuration}
                  />
                </>
              ) : (
                <>
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Text className="text-light-text-secondary dark:text-text-secondary text-sm font-medium mb-1">
                        {t('setlist.customKey', 'Sahne tonu')}
                      </Text>
                      <TextInput
                        className="bg-light-surface-2 dark:bg-surface-2 rounded-xl px-4 py-3 text-light-text-primary dark:text-text-primary border border-light-border dark:border-border mb-4"
                        placeholder={item.song?.key ?? 'Am'}
                        placeholderTextColor="#9E9E9E"
                        value={customKey}
                        onChangeText={setCustomKey}
                        autoCapitalize="characters"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-light-text-secondary dark:text-text-secondary text-sm font-medium mb-1">
                        {t('setlist.customBpm', 'Sahne BPM')}
                      </Text>
                      <TextInput
                        className="bg-light-surface-2 dark:bg-surface-2 rounded-xl px-4 py-3 text-light-text-primary dark:text-text-primary border border-light-border dark:border-border mb-4"
                        placeholder={item.song?.bpm?.toString() ?? '120'}
                        placeholderTextColor="#9E9E9E"
                        keyboardType="numeric"
                        value={customBpm}
                        onChangeText={setCustomBpm}
                      />
                    </View>
                  </View>
                </>
              )}

              <Text className="text-light-text-secondary dark:text-text-secondary text-sm font-medium mb-1">
                {t('setlist.stageNotes', 'Sahne notları')}
              </Text>
              <TextInput
                className="bg-light-surface-2 dark:bg-surface-2 rounded-xl px-4 py-3 text-light-text-primary dark:text-text-primary border border-light-border dark:border-border"
                placeholder={t(
                  'setlist.stageNotesPlaceholder',
                  'İntro 4 ölçü, solo Murat\'ta, dışarı yumuşak fade...'
                )}
                placeholderTextColor="#9E9E9E"
                multiline
                numberOfLines={4}
                value={notes}
                onChangeText={setNotes}
                style={{ minHeight: 90, textAlignVertical: 'top' }}
              />

              {/* Part atama - sadece şarkı için */}
              {!isBreak && members.length > 0 && (
                <View className="mt-5">
                  <Text className="text-light-text-secondary dark:text-text-secondary text-sm font-medium mb-2">
                    {t('setlist.partAssignments', 'Üye part ataması')}
                  </Text>
                  <Text className="text-light-text-muted dark:text-text-muted text-xs mb-3">
                    {t(
                      'setlist.partAssignmentsHint',
                      'Her üye için bu şarkıda çalacağı enstrüman/part. Boş bırakılan üye listelenmez.',
                    )}
                  </Text>

                  {members.map((m) => {
                    const label =
                      m.user?.display_name ?? m.user?.username ?? m.user_id.slice(0, 6);
                    const value = parts[m.user_id] ?? '';
                    return (
                      <View
                        key={m.id}
                        className="bg-light-surface-2 dark:bg-surface-2 rounded-xl px-3 py-3 mb-2 border border-light-border dark:border-border"
                      >
                        <View className="flex-row items-center mb-2">
                          <Avatar
                            uri={m.user?.avatar_url}
                            name={label}
                            size="sm"
                          />
                          <Text className="text-light-text-primary dark:text-text-primary text-sm font-medium ml-2 flex-1" numberOfLines={1}>
                            {label}
                          </Text>
                          {value ? (
                            <TouchableOpacity onPress={() => setPartFor(m.user_id, '')}>
                              <Text className="text-light-text-muted dark:text-text-muted text-xs">{t('common.cancel')}</Text>
                            </TouchableOpacity>
                          ) : null}
                        </View>
                        <TextInput
                          className="bg-light-surface dark:bg-surface rounded-lg px-3 py-2 text-light-text-primary dark:text-text-primary border border-light-border-light dark:border-border-light text-sm"
                          placeholder={t('setlist.partPlaceholder', 'Vokal, Solo Gitar...')}
                          placeholderTextColor="#9E9E9E"
                          value={value}
                          onChangeText={(v) => setPartFor(m.user_id, v)}
                        />
                        <View className="flex-row flex-wrap gap-1.5 mt-2">
                          {PART_PRESETS.map((preset) => (
                            <TouchableOpacity
                              key={preset}
                              onPress={() => setPartFor(m.user_id, preset)}
                              className={`px-2.5 py-1 rounded-full border ${
                                value === preset
                                  ? 'bg-primary border-primary'
                                  : 'bg-light-surface dark:bg-surface border-light-border-light dark:border-border-light'
                              }`}
                            >
                              <Text
                                className={`text-xs ${
                                  value === preset ? 'text-white' : 'text-light-text-secondary dark:text-text-secondary'
                                }`}
                              >
                                {preset}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
