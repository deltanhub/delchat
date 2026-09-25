import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './styles';
import { LeadDetailPropertyCardProps } from './types';

export const LeadDetailPropertyCard: React.FC<LeadDetailPropertyCardProps> = ({
  propertyType,
  propertyStatus,
  priceFrom,
  priceTo,
  textColor,
  borderColor,
  primaryColor,
  isDark,
}) => {
  return (
    <View
      style={[
        styles.detailSectionCard,
        { backgroundColor: isDark ? '#262626' : '#f8fafc', borderColor },
      ]}
    >
      <Text style={[styles.detailSectionTitle, { color: textColor }]}>Property Requirements</Text>
      <Text style={[styles.detailSectionRow, { color: textColor }]}>
        Type: <Text style={{ fontWeight: '700' }}>{propertyType || 'Any'}</Text>
      </Text>
      <Text style={[styles.detailSectionRow, { color: textColor }]}>
        Status: <Text style={{ fontWeight: '700' }}>{propertyStatus || 'Any'}</Text>
      </Text>
      {(priceFrom || priceTo) && (
        <Text style={[styles.detailSectionRow, { color: primaryColor, fontWeight: '700' }]}>
          Budget: {priceFrom ? `₦${priceFrom.toLocaleString()}` : '0'} -{' '}
          {priceTo ? `₦${priceTo.toLocaleString()}` : 'Any'}
        </Text>
      )}
    </View>
  );
};
