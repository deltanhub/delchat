import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import Colors from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { useColorScheme } from '../../components/useColorScheme';
import ScalePressable from '../../components/ScalePressable';
import AnimatedPageWrapper from '../../components/AnimatedPageWrapper';
import * as Haptics from '../../lib/haptics';
import { getCurrentProfile, isAgencyOrDeveloper, canReceiveLeads, AppProfile } from '../../lib/auth';

// Leads Domain Sub-components and Hook
import { MainTabType, ManualLeadItem } from '../../components/leads/types';
import { useLeadsData } from '../../components/leads/useLeadsData';
import ChatLeadsView from '../../components/leads/ChatLeadsView';
import ManualLeadsView from '../../components/leads/ManualLeadsView';
import AddManualLeadModal from '../../components/leads/AddManualLeadModal';
import LeadDetailNotesModal from '../../components/leads/LeadDetailNotesModal';

// Inquiries Domain Sub-components and Hook (Web Parity)
import { useInquiriesData } from '../../components/inquiries/useInquiriesData';
import { InquiryResponsesView } from '../../components/inquiries/InquiryResponsesView';
import { InquiryFormBuilderView } from '../../components/inquiries/InquiryFormBuilderView';
import type { InquiryMainTab } from '../../types/inquiries';

export type CrmSection = 'leads' | 'inquiries';

export default function LeadsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<AppProfile | null>(null);

  // Top-level CRM section: 'leads' vs 'inquiries'
  const [activeSection, setActiveSection] = useState<CrmSection>('leads');

  // Leads sub-tabs: 'chat' vs 'manual'
  const [activeLeadsTab, setActiveLeadsTab] = useState<MainTabType>('chat');

  // Inquiries sub-tabs: 'responses' vs 'builder'
  const [activeInquiriesTab, setActiveInquiriesTab] = useState<InquiryMainTab>('responses');

  // Modals state for leads
  const [addLeadModalVisible, setAddLeadModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedManualLead, setSelectedManualLead] = useState<ManualLeadItem | null>(null);

  // 1. Initialize user and profile with strict route guard
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace('/auth');
        return;
      }
      setCurrentUser(user);
      const prof = await getCurrentProfile();
      if (prof) {
        setCurrentProfile(prof);
        if (!canReceiveLeads(prof.mainRole)) {
          router.replace('/(tabs)');
        }
      }
    });
  }, [router]);

  // 2. Domain hook for leads data, realtime subscriptions, and updates
  const leadsData = useLeadsData(currentUser, currentProfile);

  // 3. Domain hook for inquiries data (web parity responses + form builder)
  const inquiriesData = useInquiriesData();

  // Strict Role Guard fallback UI
  if (currentProfile && !canReceiveLeads(currentProfile.mainRole)) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Ionicons name="shield-outline" size={48} color={colors.primary} style={{ marginBottom: 16 }} />
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: 8, fontFamily: Typography.fontFamily }}>
          Brokerage CRM Restricted
        </Text>
        <Text style={{ fontSize: 14, color: colors.placeholder, textAlign: 'center', marginBottom: 20, fontFamily: Typography.fontFamily }}>
          The Leads CRM workspace is reserved for licensed real estate professionals and property hosts.
        </Text>
        <ScalePressable
          onPress={() => router.replace('/(tabs)')}
          style={{ backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontFamily: Typography.fontFamily }}>Return to Inbox</Text>
        </ScalePressable>
      </View>
    );
  }

  const isAgencyOrDev = isAgencyOrDeveloper(currentProfile?.mainRole);
  const totalLeadsCount = leadsData.chatLeads.length + leadsData.manualLeads.length;

  return (
    <AnimatedPageWrapper>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />

        {/* Top Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
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
                leadsData.fetchAllLeads();
                inquiriesData.onRefresh();
              }}
              style={[styles.refreshBtn, { backgroundColor: isDark ? '#262626' : colors.primarySoft }]}
            >
              <Ionicons name="sync" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Top-Level CRM Section Switcher: Leads vs Inquiries */}
          <View style={[styles.topSectionSwitcher, { backgroundColor: isDark ? '#18181b' : '#f4f4f5' }]}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveSection('leads');
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
                setActiveSection('inquiries');
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
                  {inquiriesData.responses.length}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Sub-level Navigation: Leads (Chat vs Manual) OR Inquiries (Responses vs Builder) */}
          {activeSection === 'leads' ? (
            <View style={[styles.mainTabsContainer, { backgroundColor: isDark ? '#1a060d' : '#fcedf2', borderColor: isDark ? '#4a0f1f' : '#f5dbe3' }]}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveLeadsTab('chat');
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
                    {leadsData.chatLeads.length}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveLeadsTab('manual');
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
                    {leadsData.manualLeads.length}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.mainTabsContainer, { backgroundColor: isDark ? '#1a060d' : '#fcedf2', borderColor: isDark ? '#4a0f1f' : '#f5dbe3' }]}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveInquiriesTab('responses');
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
                    {inquiriesData.responses.length}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveInquiriesTab('builder');
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
          )}
        </View>

        {/* Body Content */}
        {activeSection === 'leads' ? (
          activeLeadsTab === 'chat' ? (
            <ChatLeadsView
              chatLeads={leadsData.chatLeads}
              loading={leadsData.loading}
              refreshing={leadsData.refreshing}
              isAgencyOrDev={isAgencyOrDev}
              currentUser={currentUser ? { id: currentUser.id } : null}
              savingChatLeadId={leadsData.savingChatLeadId}
              onRefresh={leadsData.fetchAllLeads}
              onUpdateChatLeadStatus={leadsData.updateChatLeadStatus}
              onOpenConversation={(convId) => router.push(`/thread/${convId}` as Href)}
            />
          ) : (
            <ManualLeadsView
              manualLeads={leadsData.manualLeads}
              manualCounts={leadsData.manualCounts}
              loading={leadsData.loading}
              refreshing={leadsData.refreshing}
              onRefresh={leadsData.fetchAllLeads}
              onOpenAddLead={() => setAddLeadModalVisible(true)}
              onSelectLead={(lead) => {
                setSelectedManualLead(lead);
                setDetailModalVisible(true);
              }}
            />
          )
        ) : activeInquiriesTab === 'responses' ? (
          <InquiryResponsesView
            responses={inquiriesData.filteredResponses}
            totalCount={inquiriesData.responses.length}
            tourCount={inquiriesData.responses.filter((r) => r.intentTrigger === 'tour').length}
            questionCount={inquiriesData.responses.filter((r) => r.intentTrigger === 'question').length}
            activeFilter={inquiriesData.responseFilter}
            onSelectFilter={inquiriesData.setResponseFilter}
            onOpenChat={(convId) => router.push(`/thread/${convId}` as Href)}
          />
        ) : (
          <InquiryFormBuilderView
            template={inquiriesData.currentTemplate}
            selectedTrigger={inquiriesData.selectedTrigger}
            onSelectTrigger={inquiriesData.setSelectedTrigger}
            onToggleActive={() => inquiriesData.toggleActive(inquiriesData.selectedTrigger)}
            onSaveMeta={(title, desc) => inquiriesData.saveTemplateMeta(inquiriesData.selectedTrigger, title, desc)}
            onAddField={(field) => inquiriesData.addField(inquiriesData.selectedTrigger, field)}
            onUpdateField={(fId, patch) => inquiriesData.updateField(inquiriesData.selectedTrigger, fId, patch)}
            onDeleteField={(fId) => inquiriesData.deleteField(inquiriesData.selectedTrigger, fId)}
            onReorderField={(fId, dir) => inquiriesData.reorderField(inquiriesData.selectedTrigger, fId, dir)}
          />
        )}

        {/* Lead Modals */}
        <AddManualLeadModal
          visible={addLeadModalVisible}
          isSubmitting={leadsData.isSubmittingForm}
          onClose={() => setAddLeadModalVisible(false)}
          onSubmit={leadsData.createManualLead}
        />

        <LeadDetailNotesModal
          visible={detailModalVisible}
          lead={selectedManualLead}
          isSavingNotes={leadsData.isSavingNotes}
          onClose={() => {
            setDetailModalVisible(false);
            setSelectedManualLead(null);
          }}
          onSaveNotes={async (notes) => {
            if (selectedManualLead) {
              await leadsData.saveManualLeadNotes(selectedManualLead.id, notes);
            }
          }}
          onUpdateStatus={(nextStatus) => {
            if (selectedManualLead) {
              leadsData.updateManualLeadStatus(selectedManualLead.id, nextStatus);
            }
          }}
        />
      </View>
    </AnimatedPageWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    fontFamily: Typography.fontFamily,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: Typography.fontFamily,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topSectionSwitcher: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    marginBottom: 10,
    gap: 4,
  },
  topSectionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 9,
    gap: 6,
  },
  topSectionBtnActive: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  topSectionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  mainTabsContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
  },
  mainTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 8,
  },
  mainTabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
    marginLeft: 6,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: Typography.fontFamily,
  },
});
