import { StyleSheet } from 'react-native';
import { peekStyles } from './peekStyles';
import { menuStyles } from './menuStyles';

export const styles = StyleSheet.create({
  ...peekStyles,
  ...menuStyles,
});

export default styles;
