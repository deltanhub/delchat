import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type {
  AssignmentHistoryItem,
  MasterLeadReportItem,
  PublicUserProfile,
} from '../../../components/chat/crm/types';
import type { UseLeadHistoryReportsParams, UseLeadHistoryReportsReturn } from './types';

export function useLeadHistoryReports({
  inquiryId,
  onReportsCountChange,
}: UseLeadHistoryReportsParams): UseLeadHistoryReportsReturn {
  const [history, setHistory] = useState<AssignmentHistoryItem[]>([]);
  const [historyProfiles, setHistoryProfiles] = useState<Map<string, PublicUserProfile>>(new Map());
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [reports, setReports] = useState<MasterLeadReportItem[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!inquiryId) return;
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('crm_inquiry_assignment_history')
        .select('id, action_kind, assigned_agent_user_id, assigned_by_user_id, note, created_at')
        .eq('inquiry_id', inquiryId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) {
        setHistory(data as AssignmentHistoryItem[]);
        const userIds = Array.from(
          new Set([...data.map((x: any) => x.assigned_agent_user_id), ...data.map((x: any) => x.assigned_by_user_id)].filter(Boolean) as string[])
        );
        if (userIds.length > 0) {
          const { data: pData } = await supabase.rpc('get_public_user_profiles', { requested_user_ids: userIds });
          if (pData) setHistoryProfiles(new Map((pData as PublicUserProfile[]).map((p) => [p.user_id, p])));
        }
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.warn('[useLeadHistoryReports] Error loading history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [inquiryId]);

  const loadReports = useCallback(async () => {
    if (!inquiryId) return;
    setLoadingReports(true);
    try {
      const { data, error } = await supabase
        .from('master_lead_reports')
        .select('id, inquiry_id, reporter_user_id, reason, details, messages_consent, messages_consent_at, report_status, resolution_note, resolved_by_user_id, created_at, resolved_at')
        .eq('inquiry_id', inquiryId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) {
        const reporterIds = Array.from(new Set(data.map((r: any) => r.reporter_user_id).filter(Boolean))) as string[];
        let profileMap = new Map<string, PublicUserProfile>();
        if (reporterIds.length > 0) {
          const { data: pData } = await supabase.rpc('get_public_user_profiles', { requested_user_ids: reporterIds });
          if (pData) profileMap = new Map((pData as PublicUserProfile[]).map((p) => [p.user_id, p]));
        }
        const mappedReports: MasterLeadReportItem[] = data.map((r: any) => ({
          ...r,
          reporter_name: profileMap.get(r.reporter_user_id)?.display_name || profileMap.get(r.reporter_user_id)?.full_name || 'Buyer',
        }));
        setReports(mappedReports);
        onReportsCountChange?.(mappedReports.length);
      } else {
        setReports([]);
        onReportsCountChange?.(0);
      }
    } catch (err) {
      console.warn('[useLeadHistoryReports] Error loading reports:', err);
    } finally {
      setLoadingReports(false);
    }
  }, [inquiryId, onReportsCountChange]);

  return {
    history,
    historyProfiles,
    loadingHistory,
    reports,
    loadingReports,
    loadHistory,
    loadReports,
  };
}
