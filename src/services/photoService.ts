
/**
 * Uploads a photo to the specified server
 * @param file The image file to upload
 * @param serverUrl The URL of the server to send the image to
 * @returns Promise that resolves when the upload is complete
 */
export const uploadPhoto = async (file: File, serverUrl: string): Promise<void> => {
  // Create a FormData object to send the file
  const formData = new FormData();
  formData.append('photo', file);
  
  try {
    const response = await fetch(serverUrl, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header as the browser will set it with the boundary parameter
    });
    
    if (!response.ok) {
      // Try to get more detailed error from response if possible
      let errorMessage = `Upload failed with status: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        // Ignore json parsing error, use default error message
      }
      throw new Error(errorMessage);
    }
    
    // Return the response data if needed
    return;
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw error;
  }
};
