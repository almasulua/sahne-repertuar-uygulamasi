import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { EventWithRsvps } from '../../types/event';

interface CalendarViewProps {
  events: EventWithRsvps[];
  onDayPress: (date: string) => void;
  onMonthChange?: (year: number, month: number) => void;
}

const DAYS_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Pazartesi=0
}

export function CalendarView({ events, onDayPress, onMonthChange }: CalendarViewProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const eventDates = useMemo(() => {
    const dates = new Set<string>();
    events.forEach((e) => {
      const d = new Date(e.event_date);
      dates.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    });
    return dates;
  }, [events]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const goToPrev = () => {
    const newMonth = month === 0 ? 11 : month - 1;
    const newYear = month === 0 ? year - 1 : year;
    setMonth(newMonth);
    setYear(newYear);
    onMonthChange?.(newYear, newMonth);
  };

  const goToNext = () => {
    const newMonth = month === 11 ? 0 : month + 1;
    const newYear = month === 11 ? year + 1 : year;
    setMonth(newMonth);
    setYear(newYear);
    onMonthChange?.(newYear, newMonth);
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <View className="bg-light-surface-2 dark:bg-surface-2 rounded-2xl p-4 mb-4 border border-light-border dark:border-border">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <TouchableOpacity onPress={goToPrev} className="p-2">
          <Text className="text-primary text-lg">←</Text>
        </TouchableOpacity>
        <Text className="text-light-text-primary dark:text-text-primary font-bold text-base">
          {MONTHS_TR[month]} {year}
        </Text>
        <TouchableOpacity onPress={goToNext} className="p-2">
          <Text className="text-primary text-lg">→</Text>
        </TouchableOpacity>
      </View>

      {/* Day headers */}
      <View className="flex-row mb-1">
        {DAYS_TR.map((d) => (
          <View key={d} className="flex-1 items-center">
            <Text className="text-light-text-muted dark:text-text-muted text-xs">{d}</Text>
          </View>
        ))}
      </View>

      {/* Days grid */}
      <View className="flex-row flex-wrap">
        {cells.map((day, idx) => {
          if (day === null) {
            return <View key={`empty-${idx}`} className="w-[14.28%] h-10" />;
          }
          const dateKey = `${year}-${month}-${day}`;
          const hasEvent = eventDates.has(dateKey);
          const isTodayDay = isToday(day);

          return (
            <TouchableOpacity
              key={dateKey}
              onPress={() => onDayPress(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)}
              className="w-[14.28%] h-10 items-center justify-center"
            >
              <View className={`w-8 h-8 rounded-full items-center justify-center ${isTodayDay ? 'bg-primary' : ''}`}>
                <Text className={`text-sm ${isTodayDay ? 'text-white font-bold' : 'text-light-text-primary dark:text-text-primary'}`}>
                  {day}
                </Text>
              </View>
              {hasEvent && (
                <View className="w-1.5 h-1.5 rounded-full bg-accent absolute bottom-0.5" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
