export interface MediaViewerModalProps {
  visible: boolean;
  mediaUrl: string | null;
  mediaKind?: 'image' | 'video' | string;
  title?: string;
  onClose: () => void;
}

export interface MediaViewerTopBarProps {
  title: string;
  onClose: () => void;
  onOpenExternal: () => void;
  topInset: number;
}

export interface MediaViewerStageProps {
  mediaUrl: string;
  isVideo: boolean;
  onOpenExternal: () => void;
}

export interface MediaViewerBottomBarProps {
  onOpenExternal: () => void;
  bottomInset: number;
}
