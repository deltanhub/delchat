import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';

interface InquiryHeaderProps {
  title?: string;
  description?: string;
  isDark: boolean;
}

export default function InquiryHeader({
  title,
  description,
  isDark,
}: InquiryHeaderProps) {
  return (
    <>
      <View
        style={[
          styles.inquiryHeader,
          {
            backgroundColor: isDark ? '#1f1318' : '#fdf6f8',
            borderBottomColor: isDark ? '#3a1a24' : '#efe3e8',
          },
        ]}
      >
        <Ionicons
          name="clipboard-outline"
          size={18}
          color={isDark ? '#ffffff' : '#4a0f1f'}
          style={{ marginRight: 6 }}
        />
        <Text style={[styles.inquiryHeaderTitle, { color: isDark ? '#ffffff' : '#4a0f1f' }]}>
          {title || 'Inquiry Form'}
        </Text>
      </View>
      {description ? (
        <Text style={[styles.inquiryDesc, { color: isDark ? '#d1d5db' : '#5f5360' }]}>
          {description}
        </Text>
      ) : null}
    </>
  );
}
