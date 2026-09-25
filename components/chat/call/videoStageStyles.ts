import { StyleSheet } from 'react-native';
import { Typography } from '../../../constants/Typography';

export const videoStageStyles = StyleSheet.create({
  remoteVideoCanvas: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#05070a', justifyContent: 'center', alignItems: 'center',
  },
  remoteVideoBackdropImage: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    width: '100%', height: '100%', opacity: 0.22,
  },
  remoteVideoPlaceholderBackdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#0c1017',
  },
  videoVignetteOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(3, 7, 18, 0.45)',
  },
  centerVideoCard: {
    width: 220, height: 280, borderRadius: 24,
    backgroundColor: '#111827', borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center', alignItems: 'center',
    position: 'relative', shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 12,
  },
  centerVideoImage: {
    width: '100%', height: '100%', borderRadius: 22,
  },
  centerVideoPlaceholder: {
    width: '100%', height: '100%', borderRadius: 22,
    backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center',
  },
  centerVideoInitials: {
    fontSize: 54, fontWeight: '800', color: '#94a3b8',
    fontFamily: Typography.fontFamily,
  },
  cameraPausedBadge: {
    position: 'absolute', bottom: 14, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  cameraPausedText: {
    fontSize: 11, fontWeight: '600', color: '#fbbf24', fontFamily: Typography.fontFamily,
  },
  videoQualityBadge: {
    position: 'absolute', bottom: 14, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12,
  },
  liveGreenDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e', marginRight: 6,
  },
  liveQualityText: {
    fontSize: 11, fontWeight: '600', color: '#f1f5f9', fontFamily: Typography.fontFamily,
  },
  connectionHealthBadge: {
    position: 'absolute', top: 14, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.8)', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12,
  },
  connectionHealthText: {
    fontSize: 11, fontWeight: '600', color: '#ffffff', fontFamily: Typography.fontFamily,
  },
  videoHeaderBar: {
    position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 10,
  },
  videoHeaderPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  videoHeaderName: {
    fontSize: 13, fontWeight: '600', color: '#ffffff',
    fontFamily: Typography.fontFamily, maxWidth: 140,
  },
  partnerMuteBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 6,
  },
  partnerMuteText: {
    fontSize: 10, fontWeight: '600', color: '#f87171',
  },
  headerPillDivider: {
    width: 1, height: 12, backgroundColor: 'rgba(255, 255, 255, 0.2)', marginHorizontal: 8,
  },
  videoHeaderDuration: {
    fontSize: 12, fontWeight: '600', color: '#94a3b8', fontFamily: Typography.fontFamily,
  },
});
