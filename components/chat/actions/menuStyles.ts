import { StyleSheet } from 'react-native';
import { Typography } from '../../../constants/Typography';

export const menuStyles = StyleSheet.create({
  contextMenuCard: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: '#252528',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  lastMenuRow: {
    borderBottomWidth: 0,
  },
  menuRowText: {
    fontSize: 15,
    color: '#ffffff',
    fontFamily: Typography.fontFamily,
    fontWeight: '400',
    flex: 1,
    paddingRight: 8,
  },
  destructiveText: {
    color: '#ff453a',
    fontWeight: '500',
  },
});
