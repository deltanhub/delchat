import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import ScalePressable from '../../ScalePressable';
import { styles } from './styles';
import { InquiryFieldModalFooterProps } from './types';

export const InquiryFieldModalFooter: React.FC<InquiryFieldModalFooterProps> = ({
  onClose,
  onSave,
  borderColor,
  textColor,
  primaryColor,
}) => {
  return (
    <View style={[styles.footer, { borderTopColor: borderColor }]}>
      <TouchableOpacity
        onPress={onClose}
        style={[styles.cancelBtn, { borderColor }]}
      >
        <Text style={[styles.cancelBtnText, { color: textColor }]}>Cancel</Text>
      </TouchableOpacity>
      <ScalePressable
        onPress={onSave}
        style={[styles.saveBtn, { backgroundColor: primaryColor }]}
      >
        <Text style={styles.saveBtnText}>Save Field</Text>
      </ScalePressable>
    </View>
  );
};
