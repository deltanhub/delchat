import { StyleSheet, Dimensions } from 'react-native';
import { Typography } from '../../../constants/Typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    gap: 12,
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 28,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  emojiBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  emojiChar: {
    fontSize: 24,
  },
  messagePreviewBubble: {
    maxWidth: SCREEN_WIDTH * 0.78,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  previewAuthorName: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: Typography.fontFamily,
  },
  previewBodyText: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: Typography.fontFamily,
  },
  attachmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  attachmentBadgeText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily,
  },
  previewTimeText: {
    fontSize: 10.5,
    marginTop: 6,
    alignSelf: 'flex-end',
    fontFamily: Typography.fontFamily,
  },
  actionMenuCard: {
    width: 230,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  menuItemLabel: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: Typography.fontFamily,
  },
});
