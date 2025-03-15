
// Function to validate URL
export const isValidUrl = (string: string): boolean => {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
};

// Detect if running on iOS device
export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

// Detect if running on mobile device
export const isMobile = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Check if we have permission to access photos (iOS)
export const checkPhotoLibraryPermission = async (): Promise<boolean> => {
  if (!isIOS()) return true;
  
  try {
    // On iOS, just attempting to access photos will trigger the permission prompt
    // This isn't a real API but this approach forces the permission dialog to show
    const testInput = document.createElement('input');
    testInput.type = 'file';
    testInput.accept = 'image/*';
    testInput.multiple = true;
    testInput.click();
    
    // This is a simple attempt - actual permission checking would require a native plugin
    // We're assuming that if the click doesn't throw an error, we might have permission
    return true;
  } catch (err) {
    console.error('Error checking photo permission:', err);
    return false;
  }
};

// Request photos access - this is a placeholder for a more robust solution
// In a real app, this would use a Capacitor/Cordova plugin
export const requestPhotosAccess = async (): Promise<boolean> => {
  return await checkPhotoLibraryPermission();
};
