import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { PROPERTY_TYPES, PROPERTY_STATUSES } from '../types';
import { styles } from './styles';

interface AddManualLeadPropertyFieldsProps {
  propertyType: string;
  onChangePropertyType: (val: string) => void;
  propertyStatus: string;
  onChangePropertyStatus: (val: string) => void;
  priceFrom: string;
  onChangePriceFrom: (val: string) => void;
  priceTo: string;
  onChangePriceTo: (val: string) => void;
  isDark: boolean;
  colors: { text: string; placeholder: string; border: string; primary: string };
}

export function AddManualLeadPropertyFields({
  propertyType,
  onChangePropertyType,
  propertyStatus,
  onChangePropertyStatus,
  priceFrom,
  onChangePriceFrom,
  priceTo,
  onChangePriceTo,
  isDark,
  colors,
}: AddManualLeadPropertyFieldsProps) {
  const inputBg = isDark ? '#262626' : '#f8fafc';

  return (
    <View>
      <Text style={[styles.inputLabel, { color: colors.text }]}>Property Type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 14 }}>
        {PROPERTY_TYPES.map((pt) => (
          <TouchableOpacity
            key={pt}
            onPress={() => onChangePropertyType(pt)}
            style={[
              styles.choicePill,
              propertyType === pt
                ? { backgroundColor: colors.primary, borderColor: colors.primary }
                : { borderColor: colors.border },
            ]}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: propertyType === pt ? '#ffffff' : colors.text,
              }}
            >
              {pt}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={[styles.inputLabel, { color: colors.text }]}>Listing Status</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 14 }}>
        {PROPERTY_STATUSES.map((ps) => (
          <TouchableOpacity
            key={ps}
            onPress={() => onChangePropertyStatus(ps)}
            style={[
              styles.choicePill,
              propertyStatus === ps
                ? { backgroundColor: colors.primary, borderColor: colors.primary }
                : { borderColor: colors.border },
            ]}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: propertyStatus === ps ? '#ffffff' : colors.text,
              }}
            >
              {ps}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Price From (₦)</Text>
          <TextInput
            value={priceFrom}
            onChangeText={onChangePriceFrom}
            placeholder="e.g. 25000000"
            keyboardType="numeric"
            placeholderTextColor={colors.placeholder}
            style={[
              styles.modalInput,
              {
                backgroundColor: inputBg,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Price To (₦)</Text>
          <TextInput
            value={priceTo}
            onChangeText={onChangePriceTo}
            placeholder="e.g. 50000000"
            keyboardType="numeric"
            placeholderTextColor={colors.placeholder}
            style={[
              styles.modalInput,
              {
                backgroundColor: inputBg,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}
