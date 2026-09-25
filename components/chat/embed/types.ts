export interface EmbedUrlModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (url: string, title?: string) => void;
}

export interface EmbedHeaderProps {
  onClose: () => void;
  textColor: string;
  placeholderColor: string;
}

export interface EmbedUrlInputProps {
  url: string;
  setUrl: (url: string) => void;
  error: string | null;
  setError: (error: string | null) => void;
  onPaste: () => void;
  textColor: string;
  placeholderColor: string;
  primaryColor: string;
  isDark: boolean;
}

export interface EmbedTitleInputProps {
  title: string;
  setTitle: (title: string) => void;
  textColor: string;
  placeholderColor: string;
  isDark: boolean;
}

export interface EmbedActionButtonsProps {
  onClose: () => void;
  onSubmit: () => void;
  textColor: string;
  primaryColor: string;
  isDark: boolean;
}
