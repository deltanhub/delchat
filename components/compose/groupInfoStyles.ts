import { StyleSheet } from 'react-native';
import { Typography } from '../../constants/Typography';

export const groupInfoStyles = StyleSheet.create({
  infoScroll: {
    padding: 20,
    gap: 20,
  },
  avatarPreviewContainer: {
    alignItems: 'center',
    gap: 8,
  },
  groupAvatarPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupAvatarLetter: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
  },
  avatarPreviewLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    letterSpacing: 1,
  },
  inputField: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  membersSummaryContainer: {
    gap: 8,
  },
  membersSummaryList: {
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 180,
    padding: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  summaryAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryAvatarLetter: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  summaryName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    marginLeft: 10,
    flex: 1,
  },
  createGroupButton: {
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  createGroupButtonText: {
    color: '#ffffff',
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
  },
});
