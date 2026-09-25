import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import { useColorScheme } from '../../useColorScheme';
import * as Haptics from '../../../lib/haptics';
import { styles } from './styles';
import type { CrmSection } from './types';
import { MainTabType } from '../types';
import type { InquiryMainTab } from '../../../types/inquiries';

export interface LeadsSubNavProps {
  activeSection: CrmSection;
  activeLeadsTab: MainTabType;
  activeInquiriesTab: InquiryMainTab;
  chatLeadsCount: number;
  manualLeadsCount: number;
  inquiriesCount: number;
  isDark: boolean;
  onSelectLeadsTab: (tab: MainTabType) => void;
  onSelectInquiriesTab: (tab: InquiryMainTab) => void;
}

export const LeadsSubNav: React.FC<LeadsSubNavProps> = ({
  activeSection,
  activeLeadsTab,
  activeInquiriesTab,
  chatLeadsCount,
  manualLeadsCount,
  inquiriesCount,
  isDark,
  onSelectLeadsTab,
  onSelectInquiriesTab,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  if (activeSection === 'leads') {
    return (
      <View style={[styles.mainTabsContainer, { backgroundColor: isDark ? '#1a060d' : '#fcedf2', borderColor: isDark ? '#4a0f1f' : '#f5dbe3' }]}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSelectLeadsTab('chat');
          }}
          style={[styles.mainTabBtn, activeLeadsTab === 'chat' && { backgroundColor: colors.primary }]}
        >
          <Ionicons
            name="chatbubbles-outline"
            size={13}
            color={activeLeadsTab === 'chat' ? '#ffffff' : colors.primary}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.mainTabBtnText, { color: activeLeadsTab === 'chat' ? '#ffffff' : colors.text }]}>
            Leads from chat
          </Text>
          <View style={[styles.countBadge, { backgroundColor: activeLeadsTab === 'chat' ? 'rgba(255,255,255,0.25)' : colors.primarySoft }]}>
            <Text style={[styles.countBadgeText, { color: activeLeadsTab === 'chat' ? '#ffffff' : colors.primary }]}>
              {chatLeadsCount}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSelectLeadsTab('manual');
          }}
          style={[styles.mainTabBtn, activeLeadsTab === 'manual' && { backgroundColor: colors.primary }]}
        >
          <Ionicons
            name="people-outline"
            size={13}
            color={activeLeadsTab === 'manual' ? '#ffffff' : colors.primary}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.mainTabBtnText, { color: activeLeadsTab === 'manual' ? '#ffffff' : colors.text }]}>
            My leads
          </Text>
          <View style={[styles.countBadge, { backgroundColor: activeLeadsTab === 'manual' ? 'rgba(255,255,255,0.25)' : colors.primarySoft }]}>
            <Text style={[styles.countBadgeText, { color: activeLeadsTab === 'manual' ? '#ffffff' : colors.primary }]}>
              {manualLeadsCount}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.mainTabsContainer, { backgroundColor: isDark ? '#1a060d' : '#fcedf2', borderColor: isDark ? '#4a0f1f' : '#f5dbe3' }]}>
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSelectInquiriesTab('responses');
        }}
        style={[styles.mainTabBtn, activeInquiriesTab === 'responses' && { backgroundColor: colors.primary }]}
      >
        <Ionicons
          name="document-text-outline"
          size={13}
          color={activeInquiriesTab === 'responses' ? '#ffffff' : colors.primary}
          style={{ marginRight: 6 }}
        />
        <Text style={[styles.mainTabBtnText, { color: activeInquiriesTab === 'responses' ? '#ffffff' : colors.text }]}>
          Responses
        </Text>
        <View style={[styles.countBadge, { backgroundColor: activeInquiriesTab === 'responses' ? 'rgba(255,255,255,0.25)' : colors.primarySoft }]}>
          <Text style={[styles.countBadgeText, { color: activeInquiriesTab === 'responses' ? '#ffffff' : colors.primary }]}>
            {inquiriesCount}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSelectInquiriesTab('builder');
        }}
        style={[styles.mainTabBtn, activeInquiriesTab === 'builder' && { backgroundColor: colors.primary }]}
      >
        <Ionicons
          name="construct-outline"
          size={13}
          color={activeInquiriesTab === 'builder' ? '#ffffff' : colors.primary}
          style={{ marginRight: 6 }}
        />
        <Text style={[styles.mainTabBtnText, { color: activeInquiriesTab === 'builder' ? '#ffffff' : colors.text }]}>
          Form Builder
        </Text>
      </TouchableOpacity>
    </View>
  );
};
