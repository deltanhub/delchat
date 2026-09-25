import React from 'react';
import { View, Text } from 'react-native';
import { authStyles as styles } from './styles';

interface AuthFooterProps {
  colors: any;
}

export const AuthFooter: React.FC<AuthFooterProps> = ({ colors }) => {
  return (
    <View style={styles.footer}>
      <Text style={[styles.footerText, { color: colors.placeholder }]}>
        Secure Connection via DeltanHub Identity Provider
      </Text>
    </View>
  );
};
