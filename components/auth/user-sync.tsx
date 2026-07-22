"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

export function UserSync() {
  const { isLoaded, isSignedIn, user } = useUser();
  const syncedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || syncedUserId.current === user.id) {
      return;
    }

    syncedUserId.current = user.id;

    void fetch("/api/users/sync", { method: "POST" }).then((response) => {
      if (!response.ok) {
        syncedUserId.current = null;
      }
    }).catch(() => {
      syncedUserId.current = null;
    });
  }, [isLoaded, isSignedIn, user]);

  return null;
}
