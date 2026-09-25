import { StyleSheet, Dimensions } from 'react-native';
import { Typography } from '../../../constants/Typography';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const styles = StyleSheet.create({
  keyboardAvoid: { flex: 1 },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)' },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: SCREEN_HEIGHT * 0.88,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  handleContainer: { alignItems: 'center', paddingTop: 8, paddingBottom: 4 },
  handleBar: { width: 36, height: 4, borderRadius: 2 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 8,
  },
  headerTextCol: { flex: 1, marginRight: 12 },
  modalTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
  modalSubtitle: { fontSize: Typography.sizes.xs, marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(128,128,128,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLoading: { height: 160, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: 20, paddingBottom: 8, flexGrow: 1 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { fontSize: Typography.sizes.xs, textAlign: 'center' },
});
