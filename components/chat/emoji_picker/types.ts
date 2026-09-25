import { EmojiItem } from '../../../constants/emoji-data';

export interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose?: () => void;
}

export interface EmojiCategoryBarProps {
  recentCount: number;
  activeCategoryId: string;
  onSelectCategory: (id: string) => void;
  primaryColor: string;
  isDark: boolean;
  borderColor: string;
}

export interface EmojiSearchBarProps {
  searchText: string;
  onChangeSearchText: (text: string) => void;
  onClearSearch: () => void;
  onClose?: () => void;
  placeholderColor: string;
  textColor: string;
  primaryColor: string;
  isDark: boolean;
}

export interface EmojiGridProps {
  emojis: EmojiItem[];
  searchText: string;
  onSelectEmoji: (emoji: EmojiItem) => void;
  placeholderColor: string;
}
