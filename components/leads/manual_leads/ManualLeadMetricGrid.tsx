import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import type { ManualLeadMetricGridProps } from './types';

export const ManualLeadMetricGrid: React.FC<ManualLeadMetricGridProps> = ({
  manualCounts,
  colors,
}) => {
  return (
    <View style={styles.metricGrid}>
      <View style={[styles.metricTile, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.metricIconBox, { backgroundColor: '#eef3ff' }]}>
          <Ionicons name="people" size={16} color="#3b6ff5" />
        </View>
        <Text style={[styles.metricValue, { color: colors.text }]}>{manualCounts.total}</Text>
        <Text style={[styles.metricLabel, { color: colors.placeholder }]}>Total leads</Text>
      </View>

      <View style={[styles.metricTile, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.metricIconBox, { backgroundColor: '#fff4e6' }]}>
          <Ionicons name="pulse" size={16} color="#e07c24" />
        </View>
        <Text style={[styles.metricValue, { color: colors.text }]}>{manualCounts.active}</Text>
        <Text style={[styles.metricLabel, { color: colors.placeholder }]}>Active follow-up</Text>
      </View>

      <View style={[styles.metricTile, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.metricIconBox, { backgroundColor: '#edfaf4' }]}>
          <Ionicons name="calendar" size={16} color="#1ba368" />
        </View>
        <Text style={[styles.metricValue, { color: colors.text }]}>{manualCounts.viewing}</Text>
        <Text style={[styles.metricLabel, { color: colors.placeholder }]}>Viewing scheduled</Text>
      </View>

      <View style={[styles.metricTile, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.metricIconBox, { backgroundColor: '#fdeef1' }]}>
          <Ionicons name="checkmark-done" size={16} color="#d0364e" />
        </View>
        <Text style={[styles.metricValue, { color: colors.text }]}>{manualCounts.closedOrLost}</Text>
        <Text style={[styles.metricLabel, { color: colors.placeholder }]}>Closed / Lost</Text>
      </View>
    </View>
  );
};
