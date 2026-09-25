import { StyleSheet } from 'react-native';
import { Typography } from '../../../constants/Typography';

export const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerTitle: { fontSize: Typography.sizes.xl, fontWeight: '800', fontFamily: Typography.fontFamily, letterSpacing: -0.5 },
  headerButtonsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  starredBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  composeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 40, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: Typography.sizes.sm, fontFamily: Typography.fontFamily, paddingVertical: 0 },
  tabsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tabsList: { flexDirection: 'row', gap: 6 },
  tabItem: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: 'transparent' },
  tabText: { fontSize: Typography.sizes.xs, fontFamily: Typography.fontFamily, fontWeight: '500' },
  unreadFilterPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(128,128,128,0.2)' },
  unreadFilterText: { fontSize: Typography.sizes.xs, fontFamily: Typography.fontFamily, fontWeight: '600' },
});
