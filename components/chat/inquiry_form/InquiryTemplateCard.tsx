import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScalePressable from '../../ScalePressable';
import { styles } from './styles';
import { InquiryTemplateCardProps } from './types';

export const InquiryTemplateCard: React.FC<InquiryTemplateCardProps> = ({
  item,
  onSelect,
  textColor,
  placeholderColor,
  primaryColor,
  primarySoftColor,
  isDark,
}) => {
  return (
    <ScalePressable
      onPress={() => onSelect(item)}
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#1c1c20' : '#f9fafb',
          borderColor: isDark ? '#2c2c32' : '#e5e7eb',
        },
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: isDark ? '#3a0b18' : primarySoftColor }]}>
        <Ionicons name="clipboard-outline" size={22} color={isDark ? '#f4a5b8' : primaryColor} />
      </View>

      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: textColor }]}>{item.templateTitle}</Text>
        <Text style={[styles.cardSubtitle, { color: placeholderColor }]}>
          {item.fields.length} questions •{' '}
          {item.fields.map((f) => f.fieldLabel).slice(0, 2).join(', ')}
          {item.fields.length > 2 ? '...' : ''}
        </Text>
      </View>

      <View style={[styles.sendPill, { backgroundColor: primaryColor }]}>
        <Text style={styles.sendPillText}>Send</Text>
      </View>
    </ScalePressable>
  );
};
