import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './styles';

interface InquiryResponseAnswersListProps {
  answers: Array<{ label: string; value: any }>;
  isDark: boolean;
  colors: any;
}

export const InquiryResponseAnswersList: React.FC<InquiryResponseAnswersListProps> = ({
  answers,
  isDark,
  colors,
}) => {
  if (!answers || answers.length === 0) {
    return (
      <Text style={[styles.noAnswersText, { color: colors.placeholder }]}>
        No answers recorded.
      </Text>
    );
  }

  return (
    <View style={styles.answersContainer}>
      {answers.map((ans, idx) => (
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
  );
};
