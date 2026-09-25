import { StyleSheet } from 'react-native';
import { Typography } from '../../../constants/Typography';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 14 },
  privacyBox: { padding: 12, borderRadius: 10, borderWidth: 1 },
  privacyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  privacyTitle: { fontSize: 13, fontWeight: '700', fontFamily: Typography.fontFamily },
  privacyText: { fontSize: 12, fontFamily: Typography.fontFamily, lineHeight: 16 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: { width: '48%', padding: 12, borderRadius: 10, borderWidth: 1 },
  metricLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  metricBigValue: { fontSize: 24, fontWeight: '700', fontFamily: Typography.fontFamily },
  metricValue: { fontSize: 14, fontWeight: '600', fontFamily: Typography.fontFamily, marginTop: 4 },
  metricSub: { fontSize: 11, marginTop: 4, fontFamily: Typography.fontFamily },
  card: { padding: 14, borderRadius: 12, borderWidth: 1 },
  cardTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 10 },
  propertyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  propertyImgWrap: { width: 50, height: 50, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  propertyImg: { width: '100%', height: '100%' },
  propertyName: { fontSize: 14, fontWeight: '600', fontFamily: Typography.fontFamily },
  propertySubtitle: { fontSize: 12, fontFamily: Typography.fontFamily, marginTop: 2 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  dataLabel: { fontSize: 13, fontFamily: Typography.fontFamily },
  dataValue: { fontSize: 13, fontWeight: '500', fontFamily: Typography.fontFamily },
});
