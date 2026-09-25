import React from 'react';
import { View, Text, TextInput, Switch } from 'react-native';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import ScalePressable from '../../ScalePressable';
import { styles } from './styles';
import type { FormBuilderMetaCardProps } from './types';

export const FormBuilderMetaCard: React.FC<FormBuilderMetaCardProps> = ({
  title,
  description,
  isActive,
  onTitleChange,
  onDescriptionChange,
  onToggleActive,
  onSaveDetails,
  isDark,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View
      style={[
        styles.formMetaCard,
        {
          backgroundColor: colors.card,
          borderColor: isDark ? '#27272a' : colors.border,
        },
      ]}
    >
      <View style={styles.metaRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.metaCardTitle, { color: colors.text }]}>Form Status</Text>
          <Text style={[styles.metaCardSub, { color: colors.placeholder }]}>
            {isActive
              ? 'Active — displayed to clients on request'
              : 'Deactivated — temporarily hidden from chat'}
          </Text>
        </View>
        <Switch
          value={isActive}
          onValueChange={onToggleActive}
          trackColor={{ false: isDark ? '#3f3f46' : '#d1d5db', true: colors.primary }}
        />
      </View>

      <View style={[styles.divider, { backgroundColor: isDark ? '#27272a' : '#f0e5e9' }]} />

      {/* Title Input */}
      <Text style={[styles.fieldLabelSmall, { color: colors.placeholder }]}>FORM TITLE</Text>
      <TextInput
        value={title}
        onChangeText={onTitleChange}
        placeholder="Form Title"
        placeholderTextColor={colors.placeholder}
        style={[
          styles.metaInput,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
      />

      {/* Description Input */}
      <Text style={[styles.fieldLabelSmall, { color: colors.placeholder, marginTop: 10 }]}>
        DESCRIPTION / INSTRUCTIONS
      </Text>
      <TextInput
        value={description}
        onChangeText={onDescriptionChange}
        placeholder="Instructions shown to buyer..."
        placeholderTextColor={colors.placeholder}
        multiline
        style={[
          styles.metaInput,
          styles.metaInputMulti,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
      />

      <ScalePressable
        onPress={onSaveDetails}
        style={[styles.saveMetaBtn, { backgroundColor: colors.primary }]}
      >
        <Text style={styles.saveMetaBtnText}>Save Form Details</Text>
      </ScalePressable>
    </View>
  );
};
