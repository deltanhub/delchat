import { StyleSheet, Platform } from 'react-native';
import { Typography } from '../../constants/Typography';

export const tabBarStyles = StyleSheet.create({
  barContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 66,
    borderRadius: 33,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 6,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 18,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  activeBubbleHighlight: {
    position: 'absolute',
    left: 6,
    height: 52,
    top: 6,
    borderRadius: 26,
    borderWidth: 1,
  },
  tabItemFlex: {
    flex: 1,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtonContainer: {
    height: 52,
    width: '100%',
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: Typography.fontFamily,
    marginTop: 2,
  },
});
