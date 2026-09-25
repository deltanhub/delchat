import React from 'react';
import { View, Text, TextInput, ActivityIndicator } from 'react-native';
import ScalePressable from '../ScalePressable';
import { authStyles as styles } from './styles';

interface AuthFormProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  loading: boolean;
  errorMessage: string | null;
  onSignIn: () => void;
  onOpenSignUp: () => void;
  colors: any;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  loading,
  errorMessage,
  onSignIn,
  onOpenSignUp,
  colors,
}) => {
  return (
    <View style={styles.formContainer}>
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.primaryMuted }]}>Email Address</Text>
        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
          placeholder="name@example.com"
          placeholderTextColor={colors.placeholder}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.primaryMuted }]}>Password</Text>
        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
          placeholder="••••••••"
          placeholderTextColor={colors.placeholder}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password"
        />
      </View>

      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

      <ScalePressable
        onPress={onSignIn}
        disabled={loading}
        style={[styles.button, { backgroundColor: colors.primary }]}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Sign In</Text>
        )}
      </ScalePressable>

      <View style={styles.signUpPromptContainer}>
        <Text style={[styles.signUpPromptText, { color: colors.placeholder }]}>
          Don't have an account?{' '}
        </Text>
        <ScalePressable onPress={onOpenSignUp} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[styles.signUpLinkText, { color: colors.primary }]}>Create Account</Text>
        </ScalePressable>
      </View>
    </View>
  );
};
