import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import * as Haptics from '../../../lib/haptics';
import { styles } from './styles';
import { LeadsSubNav } from './LeadsSubNav';
import { CrmSectionSwitcher } from './CrmSectionSwitcher';
import type { LeadsHeaderProps } from './types';

export const LeadsHeader: React.FC<LeadsHeaderProps> = ({
  activeSection,
  activeLeadsTab,
  activeInquiriesTab,
  totalLeadsCount,
  chatLeadsCount,
  manualLeadsCount,
  inquiriesCount,
  isDark,
  topInset,
  onRefresh,
  onSelectSection,
  onSelectLeadsTab,
  onSelectInquiriesTab,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.header, { paddingTop: topInset + 8, borderBottomColor: colors.border }]}>
      <View style={styles.headerTop}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>CRM</Text>
          <Text style={[styles.headerSubtitle, { color: colors.placeholder }]}>
            Leads pipeline & chat inquiry questionnaires
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onRefresh();
          }}
          style={[styles.refreshBtn, { backgroundColor: isDark ? '#262626' : colors.primarySoft }]}
        >
          <Ionicons name="sync" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <CrmSectionSwitcher
        activeSection={activeSection}
        onSelectSection={onSelectSection}
        totalLeadsCount={totalLeadsCount}
        inquiriesCount={inquiriesCount}
        isDark={isDark}
        colors={colors}
      />

      <LeadsSubNav
        activeSection={activeSection}
        activeLeadsTab={activeLeadsTab}
        activeInquiriesTab={activeInquiriesTab}
        chatLeadsCount={chatLeadsCount}
        manualLeadsCount={manualLeadsCount}
        inquiriesCount={inquiriesCount}
        isDark={isDark}
        onSelectLeadsTab={onSelectLeadsTab}
        onSelectInquiriesTab={onSelectInquiriesTab}
      />
    </View>
  );
};
