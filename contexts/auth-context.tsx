"use client";

import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@/services/authService";

interface AuthContextType {
  user: User | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

/**
 * Auth Provider untuk manage authentication state
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

