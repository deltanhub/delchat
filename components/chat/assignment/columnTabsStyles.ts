import { StyleSheet } from 'react-native';

export const columnTabsStyles = StyleSheet.create({
  columnSwitcherContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  columnTab: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  columnTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  columnTabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  columnTabTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  columnBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  columnBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  columnSubLabel: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
});
