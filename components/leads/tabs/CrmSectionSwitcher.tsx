import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../../../lib/haptics';
import { styles } from './styles';
import type { CrmSection } from './types';

interface CrmSectionSwitcherProps {
  activeSection: CrmSection;
  onSelectSection: (section: CrmSection) => void;
  totalLeadsCount: number;
  inquiriesCount: number;
  isDark: boolean;
  colors: any;
}

export const CrmSectionSwitcher: React.FC<CrmSectionSwitcherProps> = ({
  activeSection,
  onSelectSection,
  totalLeadsCount,
  inquiriesCount,
  isDark,
  colors,
}) => {
  return (
    <View style={[styles.topSectionSwitcher, { backgroundColor: isDark ? '#18181b' : '#f4f4f5' }]}>
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSelectSection('leads');
        }}
        style={[
          styles.topSectionBtn,
          activeSection === 'leads' && [styles.topSectionBtnActive, { backgroundColor: colors.primary }],
        ]}
      >
        <Ionicons
          name="people"
          size={14}
          color={activeSection === 'leads' ? '#ffffff' : colors.placeholder}
        />
        <Text
          style={[
            styles.topSectionBtnText,
            { color: activeSection === 'leads' ? '#ffffff' : colors.text },
          ]}
        >
          Leads
        </Text>
        <View
          style={[
            styles.countBadge,
            {
              backgroundColor: activeSection === 'leads'
                ? 'rgba(255, 255, 255, 0.25)'
                : isDark ? '#27272a' : '#e4e4e7',
            },
          ]}
        >
          <Text
            style={[
              styles.countBadgeText,
              { color: activeSection === 'leads' ? '#ffffff' : colors.primary },
            ]}
          >
            {totalLeadsCount}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSelectSection('inquiries');
        }}
        style={[
          styles.topSectionBtn,
          activeSection === 'inquiries' && [styles.topSectionBtnActive, { backgroundColor: colors.primary }],
        ]}
      >
        <Ionicons
          name="help-circle-outline"
          size={15}
          color={activeSection === 'inquiries' ? '#ffffff' : colors.placeholder}
        />
        <Text
          style={[
            styles.topSectionBtnText,
            { color: activeSection === 'inquiries' ? '#ffffff' : colors.text },
          ]}
        >
          Inquiries
        </Text>
        <View
          style={[
            styles.countBadge,
            {
              backgroundColor: activeSection === 'inquiries'
                ? 'rgba(255, 255, 255, 0.25)'
                : isDark ? '#27272a' : '#e4e4e7',
            },
          ]}
        >
          <Text
            style={[
              styles.countBadgeText,
              { color: activeSection === 'inquiries' ? '#ffffff' : colors.primary },
            ]}
          >
            {inquiriesCount}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};
