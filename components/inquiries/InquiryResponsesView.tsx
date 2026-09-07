import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useColorScheme } from '../useColorScheme';
import ScalePressable from '../ScalePressable';
import type {
  InquiryResponseItem,
  FormFilter,
} from '../../types/inquiries';

interface InquiryResponsesViewProps {
  responses: InquiryResponseItem[];
  totalCount: number;
  tourCount: number;
  questionCount: number;
  activeFilter: FormFilter;
  onSelectFilter: (filter: FormFilter) => void;
  onOpenChat: (conversationId: string) => void;
}

export const InquiryResponsesView: React.FC<InquiryResponsesViewProps> = ({
  responses,
  totalCount,
  tourCount,
  questionCount,
  activeFilter,
  onSelectFilter,
  onOpenChat,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const filterOptions: Array<{ key: FormFilter; label: string; count: number }> = [
    { key: 'all', label: 'All responses', count: totalCount },
    { key: 'tour', label: 'Tour Request', count: tourCount },
    { key: 'question', label: 'General Inquiry', count: questionCount },
  ];

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const renderResponseCard = ({ item }: { item: InquiryResponseItem }) => {
    const isTour = item.intentTrigger === 'tour';
    const initials = item.senderName
      ? item.senderName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : 'U';

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: isDark ? '#27272a' : colors.border,
          },
        ]}
      >
        {/* Header: User initials, Name, Date, and Open in Chat button */}
        <View style={styles.cardHeader}>
          <View style={styles.userRow}>
            <View
              style={[
                styles.avatarCircle,
                { backgroundColor: isTour ? '#1e3a8a' : colors.primary },
              ]}
            >
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.senderName, { color: colors.text }]} numberOfLines={1}>
                {item.senderName}
              </Text>
              <Text style={[styles.dateText, { color: colors.placeholder }]}>
                {formatDate(item.createdAt)}
              </Text>
            </View>
          </View>
          <ScalePressable
            onPress={() => onOpenChat(item.conversationId)}
            style={[styles.openChatBtn, { borderColor: colors.border }]}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.primary} />
            <Text style={[styles.openChatBtnText, { color: colors.primary }]}>Open Chat</Text>
          </ScalePressable>
        </View>

        {/* Trigger Badge & Listing Info */}
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.triggerBadge,
              {
                backgroundColor: isTour
                  ? isDark ? 'rgba(59, 130, 246, 0.15)' : '#dbeafe'
                  : isDark ? 'rgba(74, 15, 31, 0.25)' : '#fdf6f8',
              },
            ]}
          >
            <Text
              style={[
                styles.triggerBadgeText,
                { color: isTour ? (isDark ? '#60a5fa' : '#1d4ed8') : colors.primary },
              ]}
            >
              {isTour ? 'Trigger: Request a Tour' : 'Trigger: Ask a Question'}
            </Text>
          </View>
          {item.listingTitle && (
            <View
              style={[
                styles.listingPill,
                { backgroundColor: isDark ? '#1f2937' : '#f0e5e9' },
              ]}
            >
              <Ionicons name="home-outline" size={11} color={colors.primary} />
              <Text
                style={[styles.listingPillText, { color: colors.primary }]}
                numberOfLines={1}
              >
                {item.listingTitle}
              </Text>
            </View>
          )}
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: isDark ? '#27272a' : '#f0e5e9' }]} />

        {/* Answers List */}
        {item.answers && item.answers.length > 0 ? (
          <View style={styles.answersContainer}>
            {item.answers.map((ans, idx) => (
              <View key={idx} style={styles.answerRow}>
                <Text style={[styles.answerLabel, { color: colors.placeholder }]}>
                  {ans.label}
                </Text>
                <View
                  style={[
                    styles.answerValueBox,
                    {
                      backgroundColor: isDark ? '#18181b' : '#fdf9fb',
                      borderColor: isDark ? '#27272a' : '#f0e5e9',
                    },
                  ]}
                >
                  <Text style={[styles.answerValueText, { color: colors.text }]}>
                    {typeof ans.value === 'boolean'
                      ? ans.value ? 'Yes' : 'No'
                      : String(ans.value || '—')}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.noAnswersText, { color: colors.placeholder }]}>
            No answers recorded.
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Total Responses Metric Tile */}
      <View
        style={[
          styles.metricCard,
          {
            backgroundColor: colors.card,
            borderColor: isDark ? '#27272a' : colors.border,
          },
        ]}
      >
        <Text style={[styles.metricLabel, { color: colors.placeholder }]}>
          TOTAL INQUIRY RESPONSES
        </Text>
        <Text style={[styles.metricValue, { color: colors.primary }]}>{totalCount}</Text>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filterOptions.map((opt) => {
            const isSelected = activeFilter === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                onPress={() => onSelectFilter(opt.key)}
                style={[
                  styles.filterChip,
                  isSelected
                    ? { backgroundColor: colors.primary, borderColor: colors.primary }
                    : {
                        backgroundColor: colors.card,
                        borderColor: isDark ? '#27272a' : colors.border,
                      },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isSelected ? '#ffffff' : colors.text },
                  ]}
                >
                  {opt.label}
                </Text>
                <View
                  style={[
                    styles.countBadge,
                    {
                      backgroundColor: isSelected
                        ? 'rgba(255, 255, 255, 0.25)'
                        : isDark ? '#27272a' : '#f0e5e9',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.countBadgeText,
                      { color: isSelected ? '#ffffff' : colors.primary },
                    ]}
                  >
                    {opt.count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Responses List */}
      <FlatList
        data={responses}
        keyExtractor={(item) => item.id}
        renderItem={renderResponseCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? '#1c1917' : '#fdf6f8' }]}>
              <Ionicons name="document-text-outline" size={32} color={colors.placeholder} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No responses found</Text>
            <Text style={[styles.emptySub, { color: colors.placeholder }]}>
              Responses from chat inquiry questionnaires will appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  metricCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 4,
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    gap: 6,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  senderName: {
    fontSize: 14,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 11,
    marginTop: 2,
  },
  openChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  openChatBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  triggerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  triggerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  listingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: '55%',
  },
  listingPillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  answersContainer: {
    gap: 10,
  },
  answerRow: {
    gap: 4,
  },
  answerLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  answerValueBox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  answerValueText: {
    fontSize: 13,
    fontWeight: '600',
  },
  noAnswersText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 240,
  },
});
