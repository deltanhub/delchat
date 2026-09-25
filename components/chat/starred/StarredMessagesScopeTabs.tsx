import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import * as Haptics from '../../../lib/haptics';
import { StarredMessagesScopeTabsProps } from './types';

export default function StarredMessagesScopeTabs({
  scope,
  onSelectScope,
  isDark,
  colors,
}: StarredMessagesScopeTabsProps) {
  return (
    <View
      style={[
        styles.scopeContainer,
        {
          borderBottomColor: colors.border,
          backgroundColor: isDark ? '#1a1a1a' : '#f8fafc',
        },
      ]}
    >
      <View style={[styles.scopeToggle, { backgroundColor: isDark ? '#262626' : '#e2e8f0' }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSelectScope('current');
          }}
          style={[
            styles.scopeButton,
            scope === 'current' && [
              styles.scopeButtonActive,
              {
                backgroundColor: isDark ? '#4a0f1f' : colors.card,
                borderColor: isDark ? '#6e1a30' : 'transparent',
                borderWidth: isDark ? 1 : 0,
              },
            ],
          ]}
        >
          <Text
            style={[
              styles.scopeText,
              {
                color: scope === 'current'
                  ? (isDark ? '#ffffff' : colors.primary)
                  : (isDark ? '#e2e8f0' : colors.placeholder),
                fontWeight: scope === 'current' ? '700' : '500',
              },
            ]}
          >
            In this chat
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSelectScope('all');
          }}
          style={[
            styles.scopeButton,
            scope === 'all' && [
              styles.scopeButtonActive,
              {
                backgroundColor: isDark ? '#4a0f1f' : colors.card,
                borderColor: isDark ? '#6e1a30' : 'transparent',
                borderWidth: isDark ? 1 : 0,
              },
            ],
          ]}
        >
          <Text
            style={[
              styles.scopeText,
              {
                color: scope === 'all'
                  ? (isDark ? '#ffffff' : colors.primary)
                  : (isDark ? '#e2e8f0' : colors.placeholder),
                fontWeight: scope === 'all' ? '700' : '500',
              },
            ]}
          >
            All chats
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scopeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scopeToggle: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
  },
  scopeButton: {
    flex: 1,
    paddingVertical: 8,
    minHeight: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopeButtonActive: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  scopeText: {
    fontSize: 13,
    textAlign: 'center',
  },
});
