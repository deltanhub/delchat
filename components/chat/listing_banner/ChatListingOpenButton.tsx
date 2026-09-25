import React from 'react';
import { Text } from 'react-native';
import ScalePressable from '../../ScalePressable';
import { styles } from './styles';
import { ChatListingOpenButtonProps } from './types';

export const ChatListingOpenButton: React.FC<ChatListingOpenButtonProps> = ({
  onPress,
  primaryColor,
}) => {
  return (
    <ScalePressable
      onPress={onPress}
      style={[styles.openButton, { backgroundColor: primaryColor }]}
      accessibilityLabel="Open listing"
    >
      <Text style={styles.openButtonText}>Open</Text>
    </ScalePressable>
  );
};
