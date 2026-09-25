import { StyleSheet } from 'react-native';

export const callModalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 20, 0.98)',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  reconnectingBanner: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  reconnectingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  auditHiddenMeta: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },
  partnerMuteBadge: {},
  cameraPausedBadge: {},
});
