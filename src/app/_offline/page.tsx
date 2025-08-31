import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <WifiOff className="w-24 h-24 mb-8 text-destructive" />
      <h1 className="text-4xl font-bold mb-2">You are Offline</h1>
      <p className="text-lg text-muted-foreground mb-8">
        This page could not be loaded. Please check your internet connection.
      </p>
      <p className="text-sm text-muted-foreground">
        Cached pages are still available.
      </p>
    </div>
  );
}
