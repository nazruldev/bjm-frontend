"use client";

import * as React from "react";

interface LockscreenContextType {
  lock: () => void;
  unlock: () => void;
  isLocked: boolean;
}

const LockscreenContext = React.createContext<LockscreenContextType | undefined>(
  undefined
);

/**
 * Hook untuk menggunakan lockscreen context
 */
export function useLockscreen() {
  const context = React.useContext(LockscreenContext);
  if (context === undefined) {
    // Return default values jika context tidak tersedia (untuk menghindari error)
    return {
      lock: () => {
        console.warn("LockscreenProvider not found. Lock screen functionality disabled.");
      },
      unlock: () => {},
      isLocked: false,
    };
  }
  return context;
}

/**
 * Provider untuk lockscreen context
 */
export function LockscreenContextProvider({
  children,
  lock,
  unlock,
  isLocked,
}: {
  children: React.ReactNode;
  lock: () => void;
  unlock: () => void;
  isLocked: boolean;
}) {
  return (
    <LockscreenContext.Provider value={{ lock, unlock, isLocked }}>
      {children}
    </LockscreenContext.Provider>
  );
}
