
interface HeapAnalytics {
  identify: (identifier: string) => void;
  addUserProperties: (properties: Record<string, any>) => void;
  track: (eventName: string, properties?: Record<string, any>) => void;
  getUserId: () => string;
  // Add other Heap methods as needed
}

interface HotjarAnalytics {
    identify: (identifier: string, properties: Record<string, any>) => void;
}

interface Window {
  heap?: HeapAnalytics;
  hj?: HotjarAnalytics;
  heapReadyCb?: Array<{ name: string, fn: () => void }>;
}
