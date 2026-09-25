import React from 'react';
import { View, Text } from 'react-native';
import ScalePressable from '../ScalePressable';
import { renderTabBarIcon } from './tabBarIcons';
import { tabBarStyles as styles } from './tabBarStyles';

interface TabBarItemProps {
  routeName: string;
  isFocused: boolean;
  label: string;
  activeColor: string;
  inactiveColor: string;
  options: any;
  onPress: () => void;
  onLongPress: () => void;
}

export const TabBarItem: React.FC<TabBarItemProps> = ({
  routeName,
  isFocused,
  label,
  activeColor,
  inactiveColor,
  options,
  onPress,
  onLongPress,
}) => {
  const color = isFocused ? activeColor : inactiveColor;

  return (
    <View style={styles.tabItemFlex}>
      <ScalePressable
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel || label}
        testID={options.tabBarTestID}
        onPress={onPress}
        onLongPress={onLongPress}
        style={styles.tabButtonContainer}
      >
        {renderTabBarIcon(routeName, isFocused, color)}
        <Text
          numberOfLines={1}
          style={[
            styles.tabLabel,
            {
              color,
              fontWeight: isFocused ? '600' : '400',
            },
          ]}
        >
          {label}
        </Text>
      </ScalePressable>
    </View>
  );
};
