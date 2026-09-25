import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StarredMessagesEmptyStateProps } from './types';

export default function StarredMessagesEmptyState({
  loading,
  error,
  searchQuery,
  scope,
  isDark,
  colors,
  onRetry,
}: StarredMessagesEmptyStateProps) {
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.placeholder }]}>
          Loading starred messages...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={44} color="#ef4444" />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Unable to load</Text>
        <Text style={[styles.emptySubtitle, { color: colors.placeholder }]}>{error}</Text>
        <TouchableOpacity
          onPress={onRetry}
          style={[styles.retryBtn, { backgroundColor: colors.primary }]}
          accessibilityRole="button"
          accessibilityLabel="Retry loading starred messages"
        >
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.centerContainer}>
      <View style={[styles.emptyStarCircle, { backgroundColor: isDark ? '#3d2508' : '#fef3c7' }]}>
        <Ionicons name="star" size={32} color="#f59e0b" />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No starred messages</Text>
      <Text style={[styles.emptySubtitle, { color: colors.placeholder }]}>
        {searchQuery
          ? 'No starred messages matched your search query.'
          : scope === 'current'
          ? "You haven't starred any messages in this chat yet."
          : 'Star important messages in any chat to find them easily here.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 13,
    marginTop: 12,
    fontWeight: '500',
  },
  emptyStarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 260,
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});
