import { StyleSheet, Platform } from 'react-native';
import { Typography } from '../../../constants/Typography';
import { EMOJI_SIZE } from './utils';

export const styles = StyleSheet.create({
  container: {
    height: 280,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 14 : 4,
  },
  categoryBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 44,
    borderBottomWidth: 1,
    paddingHorizontal: 8,
  },
  categoryTab: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    transform: [{ scale: 1.1 }],
  },
  categoryEmoji: {
    fontSize: 18,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    padding: 0,
    fontSize: 14,
    fontFamily: Typography.fontFamily,
  },
  closeBtn: {
    paddingHorizontal: 6,
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  emojiCell: {
    width: EMOJI_SIZE,
    height: EMOJI_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 26,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    width: '100%',
  },
  emptyText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily,
    textAlign: 'center',
  },
});
