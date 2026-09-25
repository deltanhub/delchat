import { StyleSheet } from 'react-native';
import { Typography } from '../../../constants/Typography';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 14 },
  card: { padding: 14, borderRadius: 12, borderWidth: 1 },
  cardTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 10 },
  metricSub: { fontSize: 11, marginTop: 4, fontFamily: Typography.fontFamily },
  dataValue: { fontSize: 13, fontWeight: '500', fontFamily: Typography.fontFamily },
  handoffText: { fontSize: 13, fontFamily: Typography.fontFamily, fontStyle: 'italic', lineHeight: 18 },
  historyItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 8 },
  historyDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  timelineItemRow: { flexDirection: 'row', position: 'relative', paddingLeft: 22 },
  timelineConnector: { position: 'absolute', left: 4, top: 14, bottom: 0, width: 2 },
  timelineDot: { position: 'absolute', left: 0, top: 4, width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
});
