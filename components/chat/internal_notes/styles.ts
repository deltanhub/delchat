import { StyleSheet, Dimensions, Platform } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)', justifyContent: 'flex-end' },
  keyboardAvoid: { justifyContent: 'flex-end' },
  container: { height: SCREEN_HEIGHT * 0.85, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 10 }, android: { elevation: 8 } }) },
  dragHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#cbd5e1', alignSelf: 'center', marginTop: 10, marginBottom: 6 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badgeIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  subTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  privatePill: { backgroundColor: '#fef3c7', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  privatePillText: { color: '#92400e', fontSize: 9, fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 40 },
  loadingText: { fontSize: 13, marginTop: 12, fontWeight: '500' },
  emptyLockCircle: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginBottom: 6, textAlign: 'center' },
  emptySubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 19, maxWidth: 280 },
  listContent: { paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  noteCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  noteTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  authorName: { fontSize: 13, fontWeight: '700' },
  dateText: { fontSize: 11 },
  noteBody: { fontSize: 14, lineHeight: 20 },
  composerContainer: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6, borderTopWidth: StyleSheet.hairlineWidth },
  inputWrap: { flexDirection: 'row', alignItems: 'flex-end', borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, gap: 8 },
  input: { flex: 1, fontSize: 14, maxHeight: 90, paddingVertical: 4 },
  sendBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
});
