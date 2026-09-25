import React from 'react';
import { Ionicons } from '@expo/vector-icons';

export function renderTabBarIcon(name: string, isFocused: boolean, color: string) {
  let iconName: keyof typeof Ionicons.glyphMap = 'chatbubbles-outline';
  if (name === 'index') {
    iconName = isFocused ? 'chatbubbles' : 'chatbubbles-outline';
  } else if (name === 'calls') {
    iconName = isFocused ? 'call' : 'call-outline';
  } else if (name === 'leads') {
    iconName = isFocused ? 'briefcase' : 'briefcase-outline';
  } else if (name === 'settings') {
    iconName = isFocused ? 'settings' : 'settings-outline';
  }
  return <Ionicons name={iconName} size={21} color={color} />;
}
