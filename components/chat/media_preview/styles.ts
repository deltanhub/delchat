import { StyleSheet } from 'react-native';
import Colors from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 10,
  },
  topBarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCenterTitle: {
    alignItems: 'center',
  },
  counterText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
  },
  previewContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  videoBadgeOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailStripContainer: {
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  thumbnailScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  thumbWrapper: {
    width: 52,
    height: 52,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  thumbWrapperActive: {
    borderColor: Colors.light.primary,
    transform: [{ scale: 1.05 }],
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  activeBorderOverlay: {
    ...StyleSheet.absoluteFill as any,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  captionRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: 'rgba(0,0,0,0.85)',
    gap: 12,
  },
  captionInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 24,
    minHeight: 46,
    maxHeight: 100,
    paddingRight: 12,
  },
  captionInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontFamily: Typography.fontFamily,
    paddingVertical: 8,
    paddingRight: 8,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
});
