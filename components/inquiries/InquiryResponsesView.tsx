import React from 'react';
import { View, FlatList } from 'react-native';
import { useColorScheme } from '../useColorScheme';
import type {
  InquiryResponseItem,
  FormFilter,
} from '../../types/inquiries';
import {
  InquiryMetricCard,
  InquiryFilterBar,
  InquiryResponseCard,
  InquiryEmptyState,
  styles,
} from './responses';
import type { InquiryResponsesViewProps } from './responses/types';

export type { InquiryResponsesViewProps };

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
  const isDark = colorScheme === 'dark';

  const filterOptions: Array<{ key: FormFilter; label: string; count: number }> = [
    { key: 'all', label: 'All responses', count: totalCount },
    { key: 'tour', label: 'Tour Request', count: tourCount },
    { key: 'question', label: 'General Inquiry', count: questionCount },
  ];

  return (
    <View style={styles.container}>
      <InquiryMetricCard totalCount={totalCount} isDark={isDark} />

      <InquiryFilterBar
        filterOptions={filterOptions}
        activeFilter={activeFilter}
        onSelectFilter={onSelectFilter}
        isDark={isDark}
      />

      <FlatList
        data={responses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <InquiryResponseCard
            item={item}
            isDark={isDark}
            onOpenChat={onOpenChat}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<InquiryEmptyState isDark={isDark} />}
      />
    </View>
  );
};
