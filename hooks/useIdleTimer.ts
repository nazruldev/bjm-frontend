"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { lockscreenConfig } from "@/config/lockscreen.config";

/**
 * Hook untuk tracking user activity dan idle time
 */
export function useIdleTimer(
  onIdle: () => void,
  timeout: number = lockscreenConfig.idleTimeout
) {
  const [isIdle, setIsIdle] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimer = useCallback(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Update last activity time
    lastActivityRef.current = Date.now();

    // If already idle, reset to active
    if (isIdle) {
      setIsIdle(false);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setIsIdle(true);
      onIdle();
    }, timeout);
  }, [timeout, onIdle, isIdle]);

  const handleActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    if (!lockscreenConfig.enabled) {
      return;
    }

    // Events yang dianggap sebagai aktivitas
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
      "keydown",
    ];

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Initialize timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
        document.removeEventListener(event, handleActivity);
      });

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleActivity, resetTimer]);

  // Reset timer when component unmounts or dependencies change
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isIdle,
    resetTimer,
    lastActivity: lastActivityRef.current,
  };
}
