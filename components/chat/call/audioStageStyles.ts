import { StyleSheet } from 'react-native';
import { Typography } from '../../../constants/Typography';

export const audioStageStyles = StyleSheet.create({
  stageContainer: {
    alignItems: 'center',
    width: '100%',
  },
  avatarSection: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 40,
  },
  pulseRing: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#4A0F1F',
  },
  avatarContainer: {
    width: 128,
    height: 128,
    borderRadius: 64,
    position: 'relative',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 64,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 64,
    backgroundColor: '#380b18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 38,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
  },
  callKindBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4A0F1F',
    borderWidth: 2,
    borderColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
