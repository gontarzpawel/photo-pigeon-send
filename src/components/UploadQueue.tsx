
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { QueuedPhoto, photoQueue } from "@/services/photoService";
import { Progress } from "@/components/ui/progress";
import { X, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

const UploadQueue = () => {
  const [queue, setQueue] = useState<QueuedPhoto[]>([]);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    // Subscribe to queue changes
    photoQueue.setOnQueueChange(setQueue);
    
    return () => {
      // Unsubscribe when component unmounts
      photoQueue.setOnQueueChange(null);
    };
  }, []);

  const pendingCount = queue.filter(item => item.status === 'pending').length;
  const uploadingCount = queue.filter(item => item.status === 'uploading').length;
  const completedCount = queue.filter(item => item.status === 'completed').length;
  const failedCount = queue.filter(item => item.status === 'failed').length;
  
  // Don't show anything if queue is empty
  if (queue.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 right-0 w-full md:w-80 bg-white shadow-lg rounded-t-lg overflow-hidden border border-gray-200 z-50">
      <div 
        className="bg-primary text-primary-foreground p-2 flex justify-between items-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="font-medium text-sm">
          Upload Queue ({queue.length})
          {uploadingCount > 0 && ` • Uploading ${uploadingCount}`}
          {completedCount > 0 && ` • Completed ${completedCount}`}
          {failedCount > 0 && ` • Failed ${failedCount}`}
        </h3>
        <div className="flex items-center space-x-2">
          {uploadingCount > 0 && (
            <RefreshCw className="h-4 w-4 animate-spin" />
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {expanded && (
        <div className="p-2 max-h-60 overflow-y-auto">
          <div className="flex justify-between mb-2">
            <div className="text-xs text-gray-500">
              {pendingCount > 0 && `${pendingCount} pending • `}
              {uploadingCount > 0 && `${uploadingCount} uploading • `}
              {completedCount > 0 && `${completedCount} completed • `}
              {failedCount > 0 && `${failedCount} failed`}
            </div>
            <div className="flex space-x-2">
              {pendingCount > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-6 text-xs py-0" 
                  onClick={() => photoQueue.startUploadAll()}
                >
                  Upload All
                </Button>
              )}
              {(completedCount > 0 || failedCount > 0) && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-6 text-xs py-0" 
                  onClick={() => photoQueue.clearCompleted()}
                >
                  Clear Completed
                </Button>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            {queue.map((item) => (
              <div 
                key={item.id} 
                className="border rounded p-2 text-xs flex flex-col"
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="font-medium truncate flex-1">
                    {item.file.name}
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    {item.status === 'completed' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {item.status === 'failed' && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    {item.status === 'uploading' && (
                      <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0" 
                      onClick={() => photoQueue.removeFromQueue(item.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Progress 
                    value={item.progress} 
                    className="h-1.5 flex-1" 
                  />
                  <span className="text-gray-500 w-8 text-right">
                    {item.progress}%
                  </span>
                </div>
                
                {item.status === 'failed' && item.error && (
                  <div className="text-red-500 mt-1 text-xs">
                    {item.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadQueue;
