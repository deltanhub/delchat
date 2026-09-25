import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../lib/supabase';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../components/useColorScheme';
import AnimatedPageWrapper from '../../components/AnimatedPageWrapper';
import { getCurrentProfile, isAgencyOrDeveloper, canReceiveLeads, AppProfile } from '../../lib/auth';
import { MainTabType, ManualLeadItem } from '../../components/leads/types';
import { useLeadsData } from '../../components/leads/useLeadsData';
import { useInquiriesData } from '../../components/inquiries/useInquiriesData';
import type { InquiryMainTab } from '../../types/inquiries';
import {
  CrmSection,
  LeadsHeader,
  LeadsRestrictedView,
  LeadsModalsHost,
  LeadsContentSwitcher,
  styles,
} from '../../components/leads/tabs';

export type { CrmSection };

export default function LeadsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<AppProfile | null>(null);
  const [activeSection, setActiveSection] = useState<CrmSection>('leads');
  const [activeLeadsTab, setActiveLeadsTab] = useState<MainTabType>('chat');
  const [activeInquiriesTab, setActiveInquiriesTab] = useState<InquiryMainTab>('responses');
  const [addLeadModalVisible, setAddLeadModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedManualLead, setSelectedManualLead] = useState<ManualLeadItem | null>(null);

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

  const leadsData = useLeadsData(currentUser, currentProfile);
  const inquiriesData = useInquiriesData();

  if (currentProfile && !canReceiveLeads(currentProfile.mainRole)) {
    // Fallback UI: Brokerage CRM Restricted
    return <LeadsRestrictedView onReturnToInbox={() => router.replace('/(tabs)')} isDark={isDark} />;
  }

  const isAgencyOrDev = isAgencyOrDeveloper(currentProfile?.mainRole);
  const totalLeadsCount = leadsData.chatLeads.length + leadsData.manualLeads.length;

  return (
    <AnimatedPageWrapper>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />

        <LeadsHeader
          activeSection={activeSection}
          activeLeadsTab={activeLeadsTab}
          activeInquiriesTab={activeInquiriesTab}
          totalLeadsCount={totalLeadsCount}
          chatLeadsCount={leadsData.chatLeads.length}
          manualLeadsCount={leadsData.manualLeads.length}
          inquiriesCount={inquiriesData.responses.length}
          isDark={isDark}
          topInset={insets.top}
          onRefresh={() => {
            leadsData.fetchAllLeads();
            inquiriesData.onRefresh();
          }}
          onSelectSection={setActiveSection}
          onSelectLeadsTab={setActiveLeadsTab}
          onSelectInquiriesTab={setActiveInquiriesTab}
        />

        <LeadsContentSwitcher
          activeSection={activeSection}
          activeLeadsTab={activeLeadsTab}
          activeInquiriesTab={activeInquiriesTab}
          leadsData={leadsData}
          inquiriesData={inquiriesData}
          currentUser={currentUser}
          isAgencyOrDev={isAgencyOrDev}
          onOpenConversation={(convId) => router.push(`/thread/${convId}` as Href)}
          onOpenAddLead={() => setAddLeadModalVisible(true)}
          onSelectLead={(lead) => {
            setSelectedManualLead(lead);
            setDetailModalVisible(true);
          }}
        />

        <LeadsModalsHost
          addLeadModalVisible={addLeadModalVisible}
          isSubmittingForm={leadsData.isSubmittingForm}
          onCloseAddModal={() => setAddLeadModalVisible(false)}
          onSubmitAddLead={leadsData.createManualLead}
          detailModalVisible={detailModalVisible}
          selectedManualLead={selectedManualLead}
          isSavingNotes={leadsData.isSavingNotes}
          onCloseDetailModal={() => {
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
