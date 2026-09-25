import { StyleSheet } from 'react-native';
import { Typography } from '../../constants/Typography';

export const securityCardStyles = StyleSheet.create({
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingTextContainer: { flex: 1, marginRight: 16 },
  settingLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    marginBottom: 4,
  },
  settingDesc: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.xs,
    lineHeight: 16,
  },
  timeoutSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  timeoutHeader: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    marginBottom: 10,
  },
  timeoutOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 2,
  },
  timeoutLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.sm,
  },
  presenceExplainer: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.xs,
    lineHeight: 18,
    marginBottom: 10,
  },
  presenceOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginVertical: 2,
  },
  presenceDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  presenceTextContainer: { flex: 1 },
  presenceTitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  presenceSubtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
});
