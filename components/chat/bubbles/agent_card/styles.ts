import { StyleSheet, Platform } from 'react-native';
import { Typography } from '../../../../constants/Typography';

export const styles = StyleSheet.create({
  agentCardOuter: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 16,
  },
  agentCardContainer: {
    width: '100%',
    maxWidth: 450,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  agentCardAction: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  agentCardName: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 10,
    fontFamily: Typography.fontFamily,
  },
  agentCardSubtitle: {
    fontSize: 13,
    marginTop: 2,
    fontFamily: Typography.fontFamily,
  },
  agentCardDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12,
    fontFamily: Typography.fontFamily,
  },
  agentCardContactBox: {
    marginTop: 16,
    gap: 6,
  },
  agentCardContactText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily,
  },
  agentCardAssignedBy: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: Typography.fontFamily,
  },
  agentCardBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  agentCardBtn: {
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
  },
  agentCardBtnText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  agentCardReportBtn: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentCardReportBtnText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  agentCardTime: {
    fontSize: 10,
    marginTop: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 3,
  },
});
