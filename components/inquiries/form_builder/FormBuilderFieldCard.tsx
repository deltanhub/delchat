import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import { FIELD_TYPE_LABELS } from '../../../types/inquiries';
import { styles } from './styles';
import type { FormBuilderFieldCardProps } from './types';

export const FormBuilderFieldCard: React.FC<FormBuilderFieldCardProps> = ({
  item,
  index,
  totalFields,
  isDark,
  onReorderField,
  onOpenEditModal,
  onDeleteField,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isFirst = index === 0;
  const isLast = index === totalFields - 1;

  return (
    <View
      style={[
        styles.fieldCard,
        {
          backgroundColor: colors.card,
          borderColor: isDark ? '#27272a' : colors.border,
        },
      ]}
    >
      <View style={styles.fieldHeader}>
        <View style={styles.orderBadge}>
          <Text style={styles.orderBadgeText}>{index + 1}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.labelRow}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>{item.fieldLabel}</Text>
            {item.isRequired && <Text style={styles.requiredStar}>*Required</Text>}
          </View>
          <View style={styles.fieldTypePill}>
            <Text style={styles.fieldTypeText}>{FIELD_TYPE_LABELS[item.fieldType]}</Text>
          </View>
        </View>

        {/* Action buttons: Reorder, Edit, Delete */}
        <View style={styles.actionControls}>
          <TouchableOpacity
            disabled={isFirst}
            onPress={() => onReorderField(item.id, 'up')}
            style={[styles.miniBtn, isFirst && { opacity: 0.25 }]}
          >
            <Ionicons name="chevron-up" size={16} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            disabled={isLast}
            onPress={() => onReorderField(item.id, 'down')}
            style={[styles.miniBtn, isLast && { opacity: 0.25 }]}
          >
            <Ionicons name="chevron-down" size={16} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onOpenEditModal(item)}
            style={styles.miniBtn}
          >
            <Ionicons name="pencil" size={14} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDeleteField(item.id)}
            style={styles.miniBtn}
          >
            <Ionicons name="trash-outline" size={14} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {item.options && item.options.length > 0 && (
        <View style={styles.optionsPreview}>
          {item.options.map((opt, i) => (
            <View
              key={i}
              style={[
                styles.optionChip,
                { backgroundColor: isDark ? '#1f2937' : '#f0e5e9' },
              ]}
            >
              <Text style={[styles.optionChipText, { color: colors.primary }]}>{opt}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};
