import { StyleSheet } from 'react-native';
import { Typography } from '../../constants/Typography';

export const profileCardStyles = StyleSheet.create({
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatarImage: { width: 52, height: 52, borderRadius: 26, marginRight: 16 },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarLetter: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  roleBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  roleBadgeText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.xs - 1,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.3,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  verifiedBadgeText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.xs - 2,
    fontWeight: Typography.weights.semibold,
    color: '#2563eb',
    marginLeft: 3,
  },
  profileEmailSubtext: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.xs,
  },
  profileSubtext: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
});
