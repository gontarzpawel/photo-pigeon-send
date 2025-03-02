
// Extend HTMLInputElement to include webkitdirectory
declare module 'react' {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    // Add webkitdirectory attribute
    webkitdirectory?: string;
  }
}

export interface GalleryPickerProps {
  serverUrl: string;
  onPhotosSelected: (count: number) => void;
}

export interface GalleryButtonsProps {
  isLoading: boolean;
  isAutoScanLoading: boolean;
  onScanGallery: () => void;
  onAutoScanAndUpload: () => void;
  onChooseDirectoryAndUpload: () => void;
}

export interface GalleryInputsProps {
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDirectorySelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
