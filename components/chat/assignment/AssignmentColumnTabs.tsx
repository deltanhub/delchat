import React from 'react';
import { View } from 'react-native';
import AssignmentColumnTabButton from './AssignmentColumnTabButton';
import { columnTabsStyles } from './columnTabsStyles';

export interface AssignmentColumnTabsProps {
  activeTab: 'internal' | 'external';
  onSelectTab: (tab: 'internal' | 'external') => void;
  internalCount: number;
  externalCount: number;
  colors: any;
  isDark: boolean;
}

export default function AssignmentColumnTabs({
  activeTab,
  onSelectTab,
  internalCount,
  externalCount,
  colors,
  isDark,
}: AssignmentColumnTabsProps) {
  return (
    <View style={[columnTabsStyles.columnSwitcherContainer, { borderBottomColor: colors.border }]}>
      <AssignmentColumnTabButton
        label="Internal Agents"
        subLabel="In-house Team"
        iconName="shield-checkmark"
        count={internalCount}
        isActive={activeTab === 'internal'}
        onPress={() => onSelectTab('internal')}
        colors={colors}
        isDark={isDark}
        accessibilityLabel="Internal Agents"
      />
      <AssignmentColumnTabButton
        label="External Agents"
        subLabel="Co-broker & Network"
        iconName="globe-outline"
        count={externalCount}
        isActive={activeTab === 'external'}
        onPress={() => onSelectTab('external')}
        colors={colors}
        isDark={isDark}
        accessibilityLabel="External Agents"
      />
    </View>
  );
}
