import React from 'react';
import { View, Text, Image } from 'react-native';
import { authStyles as styles } from './styles';

interface AuthHeaderProps {
  colorScheme: 'light' | 'dark' | null;
  colors: any;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ colorScheme, colors }) => {
  return (
    <View style={styles.headerContainer}>
      <Image
        source={
          colorScheme === 'dark'
            ? require('../../assets/images/delchat-logo-filled.png')
            : require('../../assets/images/delchat-logo-outline.png')
        }
        style={styles.logoImage}
        resizeMode="contain"
      />
      <Text style={[styles.brandText, { color: colors.primary }]}>DelChat</Text>
      <Text style={[styles.subtitle, { color: colors.text }]}>
        Sign in with your DeltanHub account
      </Text>
    </View>
  );
};
