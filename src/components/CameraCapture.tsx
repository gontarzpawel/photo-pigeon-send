
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface CameraCaptureProps {
  onCapture: (imageBlobUrl: string, imageBlob: Blob) => void;
}

const CameraCapture = ({ onCapture }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      // Clean up by stopping all tracks when component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Prefer rear camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setIsActive(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast({
        title: "Camera access failed",
        description: "Please make sure you have given permission to access your camera.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsActive(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match the video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const imageUrl = URL.createObjectURL(blob);
          onCapture(imageUrl, blob);
          stopCamera();
        }
      }, 'image/jpeg', 0.95);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full rounded-lg overflow-hidden bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`w-full ${isActive ? 'block' : 'hidden'}`}
        />
        {!isActive && (
          <div className="w-full aspect-video bg-gray-100 flex items-center justify-center">
            <p className="text-gray-500">Camera is not active</p>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>
      
      <div className="mt-4 flex justify-center space-x-2">
        {!isActive ? (
          <Button onClick={startCamera}>
            Start Camera
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={stopCamera}>
              Cancel
            </Button>
            <Button onClick={capturePhoto}>
              Capture
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;
