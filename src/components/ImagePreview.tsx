
import { useEffect, useState } from "react";

interface ImagePreviewProps {
  imageUrl: string;
}

const ImagePreview = ({ imageUrl }: ImagePreviewProps) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
  }, [imageUrl]);

  return (
    <div className="relative w-full rounded-lg overflow-hidden bg-gray-100">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={imageUrl}
        alt="Selected photo"
        className="w-full h-auto object-contain"
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
};

export default ImagePreview;
