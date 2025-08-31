
import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <WifiOff className="w-24 h-24 mb-8 text-destructive" />
      <h1 className="text-4xl font-bold mb-4">You are Offline</h1>
      <p className="text-lg text-muted-foreground mb-2">
        It looks like you've lost your internet connection.
      </p>
      <p className="text-md text-muted-foreground">
        This page can't be displayed because it hasn't been cached yet. Please check your connection and try again.
      </p>
    </div>
  );
}
