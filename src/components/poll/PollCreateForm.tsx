import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { PollOption } from '../../types/poll';

interface PollCreateFormProps {
  onSubmit: (data: {
    question: string;
    options: PollOption[];
    poll_type: 'multiple_choice' | 'yes_no';
    is_anonymous: boolean;
  }) => void;
  isLoading?: boolean;
}

let optionIdCounter = 0;

export function PollCreateForm({ onSubmit, isLoading }: PollCreateFormProps) {
  const { t } = useTranslation();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<PollOption[]>([
    { id: `opt_${++optionIdCounter}`, text: '' },
    { id: `opt_${++optionIdCounter}`, text: '' },
  ]);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const addOption = () => {
    if (options.length >= 10) return;
    setOptions([...options, { id: `opt_${++optionIdCounter}`, text: '' }]);
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) return;
    setOptions(options.filter((o) => o.id !== id));
  };

  const updateOption = (id: string, text: string) => {
    setOptions(options.map((o) => (o.id === id ? { ...o, text } : o)));
  };

  const canSubmit = question.trim() && options.every((o) => o.text.trim()) && !isLoading;

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      {/* Soru */}
      <Text className="text-light-text-secondary dark:text-text-secondary text-sm font-medium mb-1">{t('poll.question')}</Text>
      <TextInput
        className="bg-light-surface-2 dark:bg-surface-2 rounded-xl px-4 py-3 text-light-text-primary dark:text-text-primary text-base mb-4 border border-light-border dark:border-border"
        placeholder={t('poll.questionPlaceholder')}
        placeholderTextColor="#9E9E9E"
        value={question}
        onChangeText={setQuestion}
        multiline
      />

      {/* Seçenekler */}
      <Text className="text-light-text-secondary dark:text-text-secondary text-sm font-medium mb-1">{t('poll.options')}</Text>
      {options.map((opt, idx) => (
        <View key={opt.id} className="flex-row items-center mb-2">
          <TextInput
            className="flex-1 bg-light-surface-2 dark:bg-surface-2 rounded-xl px-4 py-2.5 text-light-text-primary dark:text-text-primary text-sm border border-light-border dark:border-border"
            placeholder={`${t('poll.option')} ${idx + 1}`}
            placeholderTextColor="#9E9E9E"
            value={opt.text}
            onChangeText={(text) => updateOption(opt.id, text)}
          />
          {options.length > 2 && (
            <TouchableOpacity onPress={() => removeOption(opt.id)} className="ml-2 p-2">
              <Text className="text-error">✕</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
      {options.length < 10 && (
        <TouchableOpacity onPress={addOption} className="mb-4">
          <Text className="text-primary text-sm font-medium">+ {t('poll.addOption')}</Text>
        </TouchableOpacity>
      )}

      {/* Anonim */}
      <View className="flex-row items-center justify-between bg-light-surface-2 dark:bg-surface-2 rounded-xl px-4 py-3 mb-6 border border-light-border dark:border-border">
        <Text className="text-light-text-primary dark:text-text-primary text-sm">{t('poll.anonymous')}</Text>
        <Switch value={isAnonymous} onValueChange={setIsAnonymous} />
      </View>

      {/* Gönder */}
      <TouchableOpacity
        onPress={() => onSubmit({ question, options, poll_type: 'multiple_choice', is_anonymous: isAnonymous })}
        disabled={!canSubmit}
        className={`py-3.5 rounded-xl items-center mb-8 ${canSubmit ? 'bg-primary' : 'bg-light-surface-3 dark:bg-surface-3'}`}
      >
        <Text className={`font-semibold ${canSubmit ? 'text-white' : 'text-light-text-muted dark:text-text-muted'}`}>
          {t('poll.create')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
