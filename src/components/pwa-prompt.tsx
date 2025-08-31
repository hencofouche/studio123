
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

// This interface is a subset of the BeforeInstallPromptEvent interface
// to ensure we can use it even if the type isn't fully available in all TS libs.
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}


export function PWAPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      // Cast the event to our interface
      const promptedEvent = event as BeforeInstallPromptEvent;
      setInstallPrompt(promptedEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) {
      return;
    }
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the A2HS prompt');
    } else {
      console.log('User dismissed the A2HS prompt');
    }
    setInstallPrompt(null);
  };
  
  const handleDismissClick = () => {
    setInstallPrompt(null);
  }

  if (!installPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
        <Card className="max-w-sm">
            <CardHeader className="p-4">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-base">Install App</CardTitle>
                        <CardDescription className="text-sm mt-1">
                            Get a better experience by installing the app on your device.
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 -mt-2 -mr-2" onClick={handleDismissClick}>
                        <X className="h-4 w-4" />
                        <span className="sr-only">Dismiss</span>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <Button className="w-full" onClick={handleInstallClick}>
                    <Download className="mr-2 h-4 w-4" />
                    Install
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
