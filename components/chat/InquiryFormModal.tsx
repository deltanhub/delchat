import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import Colors from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useColorScheme } from '../useColorScheme';
import ScalePressable from '../ScalePressable';
import * as Haptics from '../../lib/haptics';

export interface InquiryFormField {
  fieldName: string;
  fieldLabel: string;
  fieldType: 'text' | 'number' | 'date' | 'select' | 'boolean';
  options?: string[];
  isRequired?: boolean;
}

export interface SelectedInquiryTemplate {
  templateId: string;
  templateTitle: string;
  fields: InquiryFormField[];
}

interface InquiryFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTemplate: (template: SelectedInquiryTemplate) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Standard verified real-estate inquiry templates
const DEFAULT_PRESET_TEMPLATES: SelectedInquiryTemplate[] = [
  {
    templateId: 'preset-tour-booking',
    templateTitle: 'Property Tour Booking Request',
    fields: [
      { fieldName: 'preferred_date', fieldLabel: 'Preferred Tour Date', fieldType: 'date', isRequired: true },
      { fieldName: 'tour_mode', fieldLabel: 'Tour Mode', fieldType: 'select', options: ['In-Person Guided Tour', 'Virtual Video Walkthrough', 'Matterport 3D Review'], isRequired: true },
      { fieldName: 'attendees_count', fieldLabel: 'Number of Attendees', fieldType: 'number', isRequired: false },
      { fieldName: 'buyer_notes', fieldLabel: 'Specific Areas of Interest or Questions', fieldType: 'text', isRequired: false },
    ],
  },
  {
    templateId: 'preset-proof-of-funds',
    templateTitle: 'Budget & Financing Qualification',
    fields: [
      { fieldName: 'max_budget', fieldLabel: 'Target Purchase Budget', fieldType: 'text', isRequired: true },
      { fieldName: 'financing_type', fieldLabel: 'Financing Method', fieldType: 'select', options: ['Cash Purchase', 'Mortgage / Bank Financing', 'Developer Installment Plan'], isRequired: true },
      { fieldName: 'timeline', fieldLabel: 'Decision Timeline', fieldType: 'select', options: ['Immediate (0-30 days)', '1 to 3 months', '3 to 6 months', 'Exploratory'], isRequired: true },
      { fieldName: 'is_preapproved', fieldLabel: 'Mortgage Pre-Approval Secured?', fieldType: 'boolean', isRequired: false },
    ],
  },
  {
    templateId: 'preset-buyer-preferences',
    templateTitle: 'Buyer Property Requirements',
    fields: [
      { fieldName: 'bedroom_count', fieldLabel: 'Minimum Bedrooms Required', fieldType: 'select', options: ['1 Bedroom', '2 Bedrooms', '3 Bedrooms', '4+ Bedrooms', 'Penthouse / Villa'], isRequired: true },
      { fieldName: 'preferred_location', fieldLabel: 'Preferred Neighborhood / State', fieldType: 'text', isRequired: true },
      { fieldName: 'property_usage', fieldLabel: 'Intended Property Use', fieldType: 'select', options: ['Primary Residence', 'Rental Investment / ROI', 'Vacation Home / Short-Let'], isRequired: true },
      { fieldName: 'parking_needed', fieldLabel: 'Dedicated Parking Required?', fieldType: 'boolean', isRequired: false },
    ],
  },
];

export default function InquiryFormModal({
  visible,
  onClose,
  onSelectTemplate,
}: InquiryFormModalProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [templates, setTemplates] = useState<SelectedInquiryTemplate[]>(DEFAULT_PRESET_TEMPLATES);
  const [loading, setLoading] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const { data: tmplRows, error } = await supabase
        .from('chat_inquiry_templates')
        .select(`
          id, title, description, intent_trigger,
          fields:chat_inquiry_template_fields (
            field_name, field_label, field_type, options, is_required, sort_order
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error && tmplRows && tmplRows.length > 0) {
        const mapped: SelectedInquiryTemplate[] = tmplRows.map((t: any) => ({
          templateId: t.id,
          templateTitle: t.title,
          fields: (t.fields || [])
            .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
            .map((f: any) => ({
              fieldName: f.field_name,
              fieldLabel: f.field_label,
              fieldType: f.field_type,
              options: Array.isArray(f.options) ? f.options : undefined,
              isRequired: f.is_required,
            })),
        }));
        setTemplates([...mapped, ...DEFAULT_PRESET_TEMPLATES]);
      } else {
        setTemplates(DEFAULT_PRESET_TEMPLATES);
      }
    } catch {
      setTemplates(DEFAULT_PRESET_TEMPLATES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      fetchTemplates();
    }
  }, [visible, fetchTemplates]);

  if (!visible) return null;

  const handleSelect = (tmpl: SelectedInquiryTemplate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelectTemplate(tmpl);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: isDark ? '#141416' : '#ffffff',
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: isDark ? '#262626' : '#e5e7eb' }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Send Inquiry Form</Text>
              <Text style={[styles.headerSubtitle, { color: colors.placeholder }]}>
                Select an interactive questionnaire for this client to complete
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={templates}
              keyExtractor={(item) => item.templateId}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <ScalePressable
                  onPress={() => handleSelect(item)}
                  style={[
                    styles.card,
                    {
                      backgroundColor: isDark ? '#1c1c20' : '#f9fafb',
                      borderColor: isDark ? '#2c2c32' : '#e5e7eb',
                    },
                  ]}
                >
                  <View style={[styles.iconBox, { backgroundColor: isDark ? '#3a0b18' : colors.primarySoft }]}>
                    <Ionicons name="clipboard-outline" size={22} color={colors.primary} />
                  </View>

                  <View style={styles.cardContent}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{item.templateTitle}</Text>
                    <Text style={[styles.cardSubtitle, { color: colors.placeholder }]}>
                      {item.fields.length} questions •{' '}
                      {item.fields.map((f) => f.fieldLabel).slice(0, 2).join(', ')}
                      {item.fields.length > 2 ? '...' : ''}
                    </Text>
                  </View>

                  <View style={[styles.sendPill, { backgroundColor: colors.primary }]}>
                    <Text style={styles.sendPillText}>Send</Text>
                  </View>
                </ScalePressable>
              )}
              contentContainerStyle={{ padding: 16 }}
            />
          )}

          {/* Legal Notice */}
          <View
            style={[
              styles.legalNoticeBox,
              {
                backgroundColor: isDark ? '#1a1416' : '#fdf6f8',
                borderTopColor: isDark ? '#2e1920' : '#faecef',
              },
            ]}
          >
            <Ionicons name="shield-checkmark-outline" size={14} color={colors.primary} style={{ marginTop: 1 }} />
            <Text style={[styles.legalNoticeText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              All inquiry templates and questionnaires submitted in chat are exploratory and strictly subject to formal contract & KYC verification under Nigerian Law. Responses do not constitute a binding legal agreement.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: SCREEN_HEIGHT * 0.75,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: Typography.fontFamily,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(128,128,128,0.12)',
  },
  centerContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  cardSubtitle: {
    fontSize: 11,
    marginTop: 3,
    fontFamily: Typography.fontFamily,
  },
  sendPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  sendPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  legalNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  legalNoticeText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
    fontFamily: Typography.fontFamily,
    fontStyle: 'italic',
  },
});
