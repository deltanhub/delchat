import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Haptics from '../../../lib/haptics';
import { styles } from './styles';
import { ChatLeadsSubTabsProps } from './types';

export function ChatLeadsSubTabs({
  subTab,
  onSelectSubTab,
  masterLeadsCount,
  myLeadsCount,
  primaryColor,
  placeholderColor,
  borderColor,
}: ChatLeadsSubTabsProps) {
  return (
    <View style={[styles.subTabsRow, { borderBottomColor: borderColor }]}>
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSelectSubTab('master');
        }}
        style={[
          styles.subTabBtn,
          subTab === 'master' && { borderBottomColor: primaryColor, borderBottomWidth: 2 },
        ]}
      >
        <Text
          style={[
            styles.subTabText,
            {
              color: subTab === 'master' ? primaryColor : placeholderColor,
              fontWeight: subTab === 'master' ? '700' : '500',
            },
          ]}
        >
          Master Leads ({masterLeadsCount})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSelectSubTab('my');
        }}
        style={[
          styles.subTabBtn,
          subTab === 'my' && { borderBottomColor: primaryColor, borderBottomWidth: 2 },
        ]}
      >
        <Text
          style={[
            styles.subTabText,
            {
              color: subTab === 'my' ? primaryColor : placeholderColor,
              fontWeight: subTab === 'my' ? '700' : '500',
            },
          ]}
        >
          My Leads ({myLeadsCount})
        </Text>
      </TouchableOpacity>
    </View>
  );
}
