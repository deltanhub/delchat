import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../../lib/supabase';
import * as Haptics from '../../../lib/haptics';
import { ManualLeadItem } from '../types';
import {
  CreateManualLeadFormData,
  insertManualCrmLead,
  updateManualCrmLeadNotes,
  updateManualCrmLeadStatus,
} from './manualLeadsOperations';

export function useManualLeadActions(
  currentUser: any,
  setManualLeads: React.Dispatch<React.SetStateAction<ManualLeadItem[]>>,
  fetchAllLeads: () => void
) {
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const createManualLead = useCallback(
    async (formData: CreateManualLeadFormData): Promise<boolean> => {
      if (!currentUser) return false;
      setIsSubmittingForm(true);
      try {
        const createdItem = await insertManualCrmLead(supabase, currentUser.id, formData);
        setManualLeads((prev) => [createdItem, ...prev]);
        Alert.alert('Lead Created', 'New CRM lead has been added successfully.');
        return true;
      } catch (err: any) {
        Alert.alert('Creation Failed', err.message);
        return false;
      } finally {
        setIsSubmittingForm(false);
      }
    },
    [currentUser, setManualLeads]
  );

  const saveManualLeadNotes = useCallback(
    async (leadId: string, notesText: string) => {
      setIsSavingNotes(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      try {
        await updateManualCrmLeadNotes(supabase, leadId, notesText);
        setManualLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, notes: notesText } : l)));
        Alert.alert('Notes Saved', 'Internal notes updated successfully.');
      } catch (err: any) {
        Alert.alert('Failed to save notes', err.message);
      } finally {
        setIsSavingNotes(false);
      }
    },
    [setManualLeads]
  );

  const updateManualLeadStatus = useCallback(
    async (leadId: string, nextStatus: ManualLeadItem['status']) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      try {
        setManualLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: nextStatus } : l)));
        await updateManualCrmLeadStatus(supabase, leadId, nextStatus);
      } catch (err: any) {
        Alert.alert('Failed to update status', err.message);
        fetchAllLeads();
      }
    },
    [setManualLeads, fetchAllLeads]
  );

  return {
    isSavingNotes,
    isSubmittingForm,
    createManualLead,
    saveManualLeadNotes,
    updateManualLeadStatus,
  };
}
