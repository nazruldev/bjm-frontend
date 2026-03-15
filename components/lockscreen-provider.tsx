"use client";

import * as React from "react";
import { Lockscreen } from "./lockscreen";
import { useIdleTimer } from "@/hooks/useIdleTimer";
import { useAuth } from "@/hooks/useAuth";
import { LockscreenContextProvider } from "@/contexts/lockscreen-context";

interface LockscreenProviderProps {
  children: React.ReactNode;
}

/**
 * Provider untuk mengelola lockscreen state
 */
export function LockscreenProvider({ children }: LockscreenProviderProps) {
  const [isLocked, setIsLocked] = React.useState(false);
  const { isAuthenticated } = useAuth();

  // Handle idle timeout
  const handleIdle = React.useCallback(() => {
    // Hanya lock jika user sudah authenticated
    if (isAuthenticated) {
      setIsLocked(true);
    }
  }, [isAuthenticated]);

  // Track user activity
  useIdleTimer(handleIdle);

  // Reset lock state ketika user logout
  React.useEffect(() => {
    if (!isAuthenticated) {
      setIsLocked(false);
    }
  }, [isAuthenticated]);

  // Handle lock (manual trigger)
  const handleLock = React.useCallback(() => {
    if (isAuthenticated) {
      setIsLocked(true);
    }
  }, [isAuthenticated]);

  // Handle unlock
  const handleUnlock = React.useCallback(() => {
    setIsLocked(false);
    // Reset timer setelah unlock
    // Timer akan di-reset otomatis oleh useIdleTimer ketika ada aktivitas
  }, []);

  // Selalu render context provider, bahkan jika tidak authenticated
  // Ini memastikan useLockscreen() bisa digunakan di mana saja
  return (
    <LockscreenContextProvider
      lock={handleLock}
      unlock={handleUnlock}
      isLocked={isLocked}
    >
      {isAuthenticated && isLocked && <Lockscreen onUnlock={handleUnlock} />}
      {children}
    </LockscreenContextProvider>
  );
}
