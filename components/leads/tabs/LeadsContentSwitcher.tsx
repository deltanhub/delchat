import React from 'react';
import { MainTabType, ManualLeadItem } from '../types';
import ChatLeadsView from '../ChatLeadsView';
import ManualLeadsView from '../ManualLeadsView';
import { InquiryResponsesView } from '../../inquiries/InquiryResponsesView';
import { InquiryFormBuilderView } from '../../inquiries/InquiryFormBuilderView';
import type { InquiryMainTab } from '../../../types/inquiries';
import type { CrmSection } from './types';

interface LeadsContentSwitcherProps {
  activeSection: CrmSection;
  activeLeadsTab: MainTabType;
  activeInquiriesTab: InquiryMainTab;
  leadsData: any;
  inquiriesData: any;
  currentUser: any;
  isAgencyOrDev: boolean;
  onOpenConversation: (convId: string) => void;
  onOpenAddLead: () => void;
  onSelectLead: (lead: ManualLeadItem) => void;
}

export const LeadsContentSwitcher: React.FC<LeadsContentSwitcherProps> = ({
  activeSection,
  activeLeadsTab,
  activeInquiriesTab,
  leadsData,
  inquiriesData,
  currentUser,
  isAgencyOrDev,
  onOpenConversation,
  onOpenAddLead,
  onSelectLead,
}) => {
  if (activeSection === 'leads') {
    if (activeLeadsTab === 'chat') {
      return (
        <ChatLeadsView
          chatLeads={leadsData.chatLeads}
          loading={leadsData.loading}
          refreshing={leadsData.refreshing}
          isAgencyOrDev={isAgencyOrDev}
          currentUser={currentUser ? { id: currentUser.id } : null}
          savingChatLeadId={leadsData.savingChatLeadId}
          onRefresh={leadsData.fetchAllLeads}
          onUpdateChatLeadStatus={leadsData.updateChatLeadStatus}
          onOpenConversation={onOpenConversation}
        />
      );
    }
    return (
      <ManualLeadsView
        manualLeads={leadsData.manualLeads}
        manualCounts={leadsData.manualCounts}
        loading={leadsData.loading}
        refreshing={leadsData.refreshing}
        onRefresh={leadsData.fetchAllLeads}
        onOpenAddLead={onOpenAddLead}
        onSelectLead={onSelectLead}
      />
    );
  }

  if (activeInquiriesTab === 'responses') {
    return (
      <InquiryResponsesView
        responses={inquiriesData.filteredResponses}
        totalCount={inquiriesData.responses.length}
        tourCount={inquiriesData.responses.filter((r: any) => r.intentTrigger === 'tour').length}
        questionCount={inquiriesData.responses.filter((r: any) => r.intentTrigger === 'question').length}
        activeFilter={inquiriesData.responseFilter}
        onSelectFilter={inquiriesData.setResponseFilter}
        onOpenChat={onOpenConversation}
      />
    );
  }

  return (
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
  );
};
