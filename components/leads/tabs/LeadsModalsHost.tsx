import React from 'react';
import AddManualLeadModal from '../AddManualLeadModal';
import LeadDetailNotesModal from '../LeadDetailNotesModal';
import type { LeadsModalsHostProps } from './types';

export const LeadsModalsHost: React.FC<LeadsModalsHostProps> = ({
  addLeadModalVisible,
  isSubmittingForm,
  onCloseAddModal,
  onSubmitAddLead,
  detailModalVisible,
  selectedManualLead,
  isSavingNotes,
  onCloseDetailModal,
  onSaveNotes,
  onUpdateStatus,
}) => {
  return (
    <>
      <AddManualLeadModal
        visible={addLeadModalVisible}
        isSubmitting={isSubmittingForm}
        onClose={onCloseAddModal}
        onSubmit={onSubmitAddLead}
      />

      <LeadDetailNotesModal
        visible={detailModalVisible}
        lead={selectedManualLead}
        isSavingNotes={isSavingNotes}
        onClose={onCloseDetailModal}
        onSaveNotes={onSaveNotes}
        onUpdateStatus={onUpdateStatus}
      />
    </>
  );
};
