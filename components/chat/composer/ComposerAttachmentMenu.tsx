import React, { useRef } from 'react';
import { StyleSheet, View, Text, Platform, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import ScalePressable from '../../ScalePressable';
import { Typography } from '../../../constants/Typography';
import { ChatAttachmentActionType, ComposerAttachmentMenuProps } from './types';
import { ATTACHMENT_OPTIONS } from './constants';

export function ComposerAttachmentMenu({
  visible,
  canAssignAgent = false,
  isDark,
  bottomOffset,
  onSelect,
  onClose,
}: ComposerAttachmentMenuProps) {
  const isSelectingAttachmentRef = useRef(false);

  const handleSelect = (type: ChatAttachmentActionType) => {
    if (isSelectingAttachmentRef.current) return;
    isSelectingAttachmentRef.current = true;
    onClose();
    setTimeout(() => {
      isSelectingAttachmentRef.current = false;
      onSelect(type);
    }, Platform.OS === 'ios' ? 250 : 60);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.menuBackdrop} onPress={onClose}>
        <Animated.View
          entering={SlideInDown.springify().damping(16).mass(0.9)}
          exiting={SlideOutDown.duration(150)}
          style={[
            styles.floatingMenuCard,
            {
              backgroundColor: isDark ? '#18181b' : '#ffffff',
              borderColor: isDark ? '#27272a' : 'rgba(0, 0, 0, 0.08)',
              bottom: bottomOffset,
            },
          ]}
        >
          {ATTACHMENT_OPTIONS.filter(
            (opt) => opt.key !== 'assign-agent' || canAssignAgent
          ).map((item) => (
            <ScalePressable
              key={item.key}
              style={styles.menuRowItem}
              onPress={() => handleSelect(item.key)}
            >
              <View
                style={[
                  styles.menuIconCircle,
                  { backgroundColor: isDark ? item.darkBg : item.lightBg },
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={isDark ? item.darkColor : item.lightColor}
                />
              </View>
              <View style={styles.menuTextCol}>
                <Text
                  style={[
                    styles.menuTitleText,
                    { color: isDark ? '#ffffff' : '#101828' },
                  ]}
                >
                  {item.title}
                </Text>
                <Text
                  style={[
                    styles.menuDescText,
                    { color: isDark ? '#9ca3af' : '#667085' },
                  ]}
                >
                  {item.description}
                </Text>
              </View>
            </ScalePressable>
          ))}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  floatingMenuCard: {
    position: 'absolute',
    left: 12,
    width: 290,
    maxWidth: '86%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 6,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 8,
  },
  menuRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 14,
    gap: 12,
  },
  menuIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextCol: {
    flex: 1,
  },
  menuTitleText: {
    fontSize: 13.5,
    fontWeight: '600',
    fontFamily: Typography.fontFamily,
    lineHeight: 18,
  },
  menuDescText: {
    fontSize: 11,
    marginTop: 1,
    fontFamily: Typography.fontFamily,
    lineHeight: 14,
  },
});
