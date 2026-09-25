import { StyleSheet } from 'react-native';
import { Typography } from '../../../constants/Typography';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 14 },
  card: { padding: 14, borderRadius: 12, borderWidth: 1 },
  cardTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 10 },
  composerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  visibilityChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  visibilityChipText: { fontSize: 10, fontWeight: '600', fontFamily: Typography.fontFamily },
  noteInput: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 13, fontFamily: Typography.fontFamily, minHeight: 64, textAlignVertical: 'top', marginTop: 8 },
  postNoteBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6 },
  postNoteBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '600', fontFamily: Typography.fontFamily },
  handoffBox: { padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 6 },
  handoffTitle: { fontSize: 12, fontWeight: '700', fontFamily: Typography.fontFamily, marginBottom: 4 },
  handoffText: { fontSize: 13, fontFamily: Typography.fontFamily, fontStyle: 'italic', lineHeight: 18 },
  metricSub: { fontSize: 11, marginTop: 4, fontFamily: Typography.fontFamily },
  noteItemCard: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 8 },
  noteItemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  noteAvatar: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  noteAvatarText: { color: '#ffffff', fontSize: 10, fontWeight: '700', fontFamily: Typography.fontFamily },
  noteAuthorText: { fontSize: 12, fontWeight: '600', fontFamily: Typography.fontFamily },
  noteDateText: { fontSize: 10, fontFamily: Typography.fontFamily },
  visibilityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: StyleSheet.hairlineWidth },
  visibilityBadgeText: { fontSize: 9, fontWeight: '600', fontFamily: Typography.fontFamily },
  noteBodyText: { fontSize: 12.5, lineHeight: 18, fontFamily: Typography.fontFamily },
});
