import { StyleSheet } from 'react-native';
import { Typography } from '../../constants/Typography';
import { profileCardStyles } from './profileCardStyles';
import { securityCardStyles } from './securityCardStyles';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  headerContainer: { marginBottom: 24 },
  headerTitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.sm,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 4,
    marginBottom: 8,
  },
  signOutRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  signOutText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: '#ff3b30',
    marginLeft: 12,
  },
  ...profileCardStyles,
  ...securityCardStyles,
});

export default styles;
