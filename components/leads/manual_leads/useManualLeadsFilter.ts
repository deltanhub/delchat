import { useState, useMemo } from 'react';
import { ManualLeadItem } from '../types';

export function useManualLeadsFilter(manualLeads: ManualLeadItem[]) {
  const [manualFilterStatus, setManualFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredManualLeads = useMemo(() => {
    return manualLeads.filter((lead) => {
      if (manualFilterStatus !== 'all' && lead.status !== manualFilterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = lead.contactName.toLowerCase().includes(q);
        const matchesEmail = lead.contactEmail?.toLowerCase().includes(q) || false;
        const matchesPhone = lead.contactPhone?.toLowerCase().includes(q) || false;
        const matchesType = lead.propertyType?.toLowerCase().includes(q) || false;
        return matchesName || matchesEmail || matchesPhone || matchesType;
      }
      return true;
    });
  }, [manualLeads, manualFilterStatus, searchQuery]);

  return {
    manualFilterStatus,
    setManualFilterStatus,
    searchQuery,
    setSearchQuery,
    filteredManualLeads,
  };
}
