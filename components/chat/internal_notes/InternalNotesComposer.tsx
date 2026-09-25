import React from 'react';
import { View, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import ScalePressable from '../../ScalePressable';
import { styles } from './styles';
import type { InternalNotesComposerProps } from './types';

export const InternalNotesComposer: React.FC<InternalNotesComposerProps> = ({
  value,
  onChangeText,
  onSubmit,
  isSubmitting,
  isDark,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View
      style={[
        styles.composerContainer,
        {
          borderTopColor: colors.border,
          backgroundColor: isDark ? '#140509' : '#fcfdfd',
        },
      ]}
    >
      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: isDark ? '#1f1f1f' : '#ffffff',
            borderColor: colors.border,
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Add confidential team note..."
          placeholderTextColor={colors.placeholder}
          style={[styles.input, { color: colors.text }]}
          multiline
          maxLength={500}
        />
        <ScalePressable
          onPress={onSubmit}
          disabled={isSubmitting || !value.trim()}
          style={[
            styles.sendBtn,
            {
              backgroundColor: value.trim() ? colors.primary : colors.border,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Submit internal note"
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Ionicons name="arrow-up" size={18} color="#ffffff" />
          )}
        </ScalePressable>
      </View>
    </View>
  );
};
