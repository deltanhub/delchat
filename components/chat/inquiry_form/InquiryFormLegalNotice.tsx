import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import { InquiryFormLegalNoticeProps } from './types';

export const InquiryFormLegalNotice: React.FC<InquiryFormLegalNoticeProps> = ({
  primaryColor,
  isDark,
}) => {
  return (
    <View
      style={[
        styles.legalNoticeBox,
        {
          backgroundColor: isDark ? '#1a1416' : '#fdf6f8',
          borderTopColor: isDark ? '#2e1920' : '#faecef',
        },
      ]}
    >
      <Ionicons
        name="shield-checkmark-outline"
        size={14}
        color={isDark ? '#f4a5b8' : primaryColor}
        style={{ marginTop: 1 }}
      />
      <Text
        style={[
          styles.legalNoticeText,
          { color: isDark ? '#9ca3af' : '#6b7280' },
        ]}
      >
        All inquiry templates and questionnaires submitted in chat are exploratory and strictly
        subject to formal contract & KYC verification under Nigerian Law. Responses do not
        constitute a binding legal agreement.
      </Text>
    </View>
  );
};
