
"use client"

import { useEffect } from "react"
import { useToast } from "./use-toast"
import { Button } from "@/components/ui/button"

export const usePwaUpdate = () => {
  const { toast } = useToast()

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && window.workbox !== undefined) {
      const wb = window.workbox

      const promptToUpdate = () => {
        toast({
          title: "Update Available",
          description: "A new version of the app is available.",
          action: (
            <Button
              onClick={() => {
                wb.addEventListener("controlling", () => {
                  window.location.reload()
                })
                wb.messageSkipWaiting()
              }}
            >
              Update
            </Button>
          ),
          duration: Infinity, // Keep the toast until user interacts
        })
      }

      // A new service worker has installed, but is waiting to activate.
      wb.addEventListener("waiting", promptToUpdate)

      // Fires when the controlling service worker is updated.
      // This is useful forforce-reloading the page when the SW is updated.
      // wb.addEventListener('controlling', (event) => {
      //   if (event.isUpdate) {
      //       window.location.reload();
      //   }
      // });

    }
  }, [toast])
}
