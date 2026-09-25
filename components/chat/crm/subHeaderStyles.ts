import { StyleSheet } from 'react-native';
import { Typography } from '../../../constants/Typography';

export const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    paddingTop: 8,
  },
  pillsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 8,
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
    flex: 1,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '700',
  },
  handoffBox: {
    marginHorizontal: 16,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  handoffTitle: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Typography.fontFamily,
    marginBottom: 2,
  },
  handoffText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily,
    lineHeight: 16,
  },
  tabsRow: {
    borderBottomWidth: 1,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 16,
  },
  tabBtn: {
    paddingVertical: 8,
  },
  tabBtnText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily,
  },
});
