import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FIELD_TYPE_LABELS } from '../../../types/inquiries';
import { FIELD_TYPES } from './constants';
import { styles } from './styles';
import { InquiryFieldTypeSelectorProps } from './types';

export const InquiryFieldTypeSelector: React.FC<InquiryFieldTypeSelectorProps> = ({
  fieldType,
  setFieldType,
  primaryColor,
  backgroundColor,
  borderColor,
  textColor,
}) => {
  return (
    <View>
      <Text style={[styles.inputLabel, { color: textColor, marginTop: 16 }]}>
        FIELD TYPE
      </Text>
      <View style={styles.typeGrid}>
        {FIELD_TYPES.map((t) => {
          const isSelected = fieldType === t;
          return (
            <TouchableOpacity
              key={t}
              onPress={() => setFieldType(t)}
              style={[
                styles.typeChip,
                isSelected
                  ? { backgroundColor: primaryColor, borderColor: primaryColor }
                  : {
                      backgroundColor,
                      borderColor,
                    },
              ]}
            >
              <Text
                style={[
                  styles.typeChipText,
                  { color: isSelected ? '#ffffff' : textColor },
                ]}
              >
                {FIELD_TYPE_LABELS[t]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
