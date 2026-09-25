import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';
import { MANUAL_LEAD_STATUS_OPTIONS } from '../types';
import { styles } from './styles';
import { LeadDetailStageSelectorProps } from './types';

export const LeadDetailStageSelector: React.FC<LeadDetailStageSelectorProps> = ({
  currentStatus,
  onUpdateStatus,
  textColor,
  borderColor,
  primaryColor,
}) => {
  return (
    <>
      <Text style={[styles.detailSectionTitle, { color: textColor, marginTop: 14, marginBottom: 8 }]}>
        Pipeline Stage
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, marginBottom: 14 }}
      >
        {MANUAL_LEAD_STATUS_OPTIONS.filter((s) => s.value !== 'all').map((st) => {
          const isCurrent = currentStatus === st.value;
          return (
            <TouchableOpacity
              key={st.value}
              onPress={() => onUpdateStatus(st.value as any)}
              style={[
                styles.choicePill,
                isCurrent
                  ? { backgroundColor: primaryColor, borderColor: primaryColor }
                  : { borderColor },
              ]}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: isCurrent ? '#ffffff' : textColor,
                }}
              >
                {st.shortLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </>
  );
};
