import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import type { FormTrigger } from '../../../types/inquiries';
import { TRIGGER_META } from '../../../types/inquiries';
import { styles } from './styles';
import type { FormBuilderTriggerCardsProps } from './types';

export const FormBuilderTriggerCards: React.FC<FormBuilderTriggerCardsProps> = ({
  selectedTrigger,
  isActive,
  onSelectTrigger,
  isDark,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View>
      <Text style={[styles.sectionHeading, { color: colors.placeholder }]}>
        SELECT QUESTIONNAIRE FORM
      </Text>
      <View style={styles.triggerSelectorRow}>
        {(['tour', 'question'] as FormTrigger[]).map((trig) => {
          const meta = TRIGGER_META[trig];
          const isSelected = selectedTrigger === trig;
          return (
            <TouchableOpacity
              key={trig}
              onPress={() => onSelectTrigger(trig)}
              style={[
                styles.triggerCard,
                isSelected
                  ? {
                      borderColor: colors.primary,
                      backgroundColor: isDark ? 'rgba(74, 15, 31, 0.25)' : '#fdf6f8',
                    }
                  : {
                      borderColor: isDark ? '#27272a' : colors.border,
                      backgroundColor: colors.card,
                    },
              ]}
            >
              <View style={styles.triggerCardTop}>
                <Text
                  style={[
                    styles.triggerCardTitle,
                    { color: isSelected ? colors.primary : colors.text },
                  ]}
                >
                  {meta.label}
                </Text>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isActive ? '#10b981' : '#9ca3af' },
                  ]}
                />
              </View>
              <Text style={[styles.triggerCardSub, { color: colors.placeholder }]}>
                {meta.subtitle}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
