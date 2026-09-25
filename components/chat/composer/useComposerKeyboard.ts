import { useState, useEffect } from 'react';
import { Platform, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useComposerKeyboard() {
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setIsKeyboardVisible(true);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const bottomPadding = isKeyboardVisible
    ? Platform.OS === 'ios'
      ? 8
      : 4
    : Math.max(insets.bottom, Platform.OS === 'ios' ? 14 : 8);

  const menuBottomOffset = Math.max(insets.bottom, 16) + 54;

  return {
    isKeyboardVisible,
    bottomPadding,
    menuBottomOffset,
  };
}
