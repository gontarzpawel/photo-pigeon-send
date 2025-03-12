
interface HeapAnalytics {
  identify: (identifier: string) => void;
  addUserProperties: (properties: Record<string, any>) => void;
  track: (eventName: string, properties?: Record<string, any>) => void;
  // Add other Heap methods as needed
}

interface Window {
  heap?: HeapAnalytics;
  heapReadyCb?: Array<{ name: string, fn: () => void }>;
}
