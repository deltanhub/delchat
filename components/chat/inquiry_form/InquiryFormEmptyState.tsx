import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import { InquiryFormEmptyStateProps } from './types';

export const InquiryFormEmptyState: React.FC<InquiryFormEmptyStateProps> = ({
  textColor,
  placeholderColor,
}) => {
  return (
    <View style={styles.centerContainer}>
      <Ionicons name="clipboard-outline" size={44} color={placeholderColor} />
      <Text style={[styles.emptyTitle, { color: textColor }]}>No Inquiry Forms Yet</Text>
      <Text style={[styles.emptySubtitle, { color: placeholderColor }]}>
        Create your inquiry templates in the DeltanHub dashboard under{'\n'}Inquiries › Form Builder.
      </Text>
    </View>
  );
};
