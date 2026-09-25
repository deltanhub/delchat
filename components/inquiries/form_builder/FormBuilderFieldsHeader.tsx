import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import ScalePressable from '../../ScalePressable';
import { styles } from './styles';
import type { FormBuilderFieldsHeaderProps } from './types';

export const FormBuilderFieldsHeader: React.FC<FormBuilderFieldsHeaderProps> = ({
  fieldsCount,
  onOpenAddModal,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={styles.fieldsSectionHeader}>
      <View>
        <Text style={[styles.fieldsTitle, { color: colors.text }]}>Form Fields</Text>
        <Text style={[styles.fieldsCount, { color: colors.placeholder }]}>
          {fieldsCount} questions configured
        </Text>
      </View>
      <ScalePressable
        onPress={onOpenAddModal}
        style={[styles.addFieldBtn, { backgroundColor: colors.primary }]}
      >
        <Ionicons name="add" size={16} color="#ffffff" />
        <Text style={styles.addFieldBtnText}>Add Field</Text>
      </ScalePressable>
    </View>
  );
};
