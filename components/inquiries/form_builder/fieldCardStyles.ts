import { StyleSheet } from 'react-native';

export const fieldCardStyles = StyleSheet.create({
  addFieldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    gap: 4,
  },
  addFieldBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  fieldCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  orderBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(74, 15, 31, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4a0f1f',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  requiredStar: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ef4444',
  },
  fieldTypePill: {
    marginTop: 2,
  },
  fieldTypeText: {
    fontSize: 10,
    color: '#6b7280',
  },
  actionControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniBtn: {
    padding: 6,
  },
  optionsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    paddingLeft: 34,
  },
  optionChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  optionChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
