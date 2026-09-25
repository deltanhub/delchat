import { StyleSheet } from 'react-native';
import { Typography } from '../../../../constants/Typography';

export const styles = StyleSheet.create({
  controlsSection: {
    width: '100%',
    alignItems: 'center',
  },
  incomingActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 280,
  },
  inCallControlsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  togglesRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    maxWidth: 320,
  },
  actionCol: {
    alignItems: 'center',
    gap: 8,
  },
  circleBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  smallCircleBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  activeToggleBtn: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  declineBtn: {
    backgroundColor: '#ef4444',
  },
  acceptBtn: {
    backgroundColor: '#22c55e',
  },
  endCallBtn: {
    backgroundColor: '#ef4444',
  },
  actionBtnLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#cbd5e1',
    fontFamily: Typography.fontFamily,
  },
  videoControlsDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 30,
  },
  videoControlsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 36,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  dockBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dockBtnActive: {
    backgroundColor: '#4A0F1F',
  },
  dockBtnActiveRed: {
    backgroundColor: '#ef4444',
  },
  dockBtnEnd: {
    backgroundColor: '#ef4444',
  },
});
