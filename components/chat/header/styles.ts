import { StyleSheet, Platform } from 'react-native';
import { Typography } from '../../../constants/Typography';

export const styles = StyleSheet.create({
  container: { paddingBottom: 10, borderBottomWidth: 1, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 2 }, android: { elevation: 2 } }) },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8 },
  leftSection: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  rightSection: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  iconButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19 },
  disabledBtn: { opacity: 0.45 },
  avatarCol: { marginHorizontal: 4, position: 'relative' },
  avatarFrame: { width: 38, height: 38, borderRadius: 19, overflow: 'hidden' },
  avatar: { width: 38, height: 38 },
  avatarInitials: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarInitialsText: { fontSize: 14, fontFamily: Typography.fontFamily, fontWeight: '600' },
  detailsCol: { flex: 1, marginLeft: 6, justifyContent: 'center' },
  partnerNameText: { fontSize: 15, fontFamily: Typography.fontFamily, fontWeight: '600', flexShrink: 1 },
  presenceDot: { width: 7, height: 7, borderRadius: 3.5 },
  groupBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginLeft: 4 },
  groupBadgeText: { fontSize: 10, fontWeight: '700', fontFamily: Typography.fontFamily },
  verifiedBadge: { width: 15, height: 15, borderRadius: 8, backgroundColor: '#5C1324', alignItems: 'center', justifyContent: 'center' },
  statusText: { fontSize: 11, fontFamily: Typography.fontFamily, marginTop: 1 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.2)', justifyContent: 'flex-start', alignItems: 'flex-end' },
  dropdownMenu: { position: 'absolute', right: 16, width: 170, borderRadius: 14, borderWidth: 1, padding: 4, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 12 }, android: { elevation: 6 } }) },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.03)' },
  lastItem: { borderBottomWidth: 0 },
  menuIcon: { marginRight: 10 },
  menuItemText: { fontSize: 13, fontFamily: Typography.fontFamily, fontWeight: '500' },
});
