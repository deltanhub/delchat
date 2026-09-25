import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScalePressable from '../../ScalePressable';
import { MANUAL_LEAD_STATUS_OPTIONS } from '../types';
import { styles } from './styles';
import type { ManualLeadCardProps } from './types';

export const ManualLeadCard: React.FC<ManualLeadCardProps> = ({
  lead,
  onSelectLead,
  colors,
  isDark,
}) => {
  const statusMeta =
    MANUAL_LEAD_STATUS_OPTIONS.find((s) => s.value === lead.status) || MANUAL_LEAD_STATUS_OPTIONS[1];

  const propertyDetails = [lead.propertyType, lead.propertyStatus].filter(Boolean).join(' · ') || 'General Inquiry';

  return (
    <ScalePressable
      onPress={() => onSelectLead(lead)}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{lead.contactName}</Text>
            <View
              style={[
                styles.statusPill,
                { backgroundColor: isDark ? statusMeta.bgDark : statusMeta.bgLight },
              ]}
            >
              <Text style={[styles.statusPillText, { color: statusMeta.color }]}>
                {statusMeta.shortLabel?.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={[styles.cardMeta, { color: colors.placeholder }]}>
            {propertyDetails}
          </Text>

          {(lead.priceFrom || lead.priceTo) && (
            <Text style={[styles.budgetBadgeText, { color: colors.primary }]}>
              Budget: {lead.priceFrom ? `₦${lead.priceFrom.toLocaleString()}` : '0'} -{' '}
              {lead.priceTo ? `₦${lead.priceTo.toLocaleString()}` : 'Any'}
            </Text>
          )}
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
      </View>

      <View style={[styles.cardFooterSimple, { borderTopColor: colors.border }]}>
        <Text style={[styles.timestampText, { color: colors.placeholder }]}>
          Source: {lead.source} · {new Date(lead.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </ScalePressable>
  );
};
