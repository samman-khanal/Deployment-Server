import React, { createContext, useEffect, useState } from "react";
import { disconnectSocket } from "../services/socket.service";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: "user" | "admin";
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User, remember?: boolean) => void;
  updateUser: (patch: Partial<User>) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Restore auth state on refresh
  useEffect(() => {
    const storedToken =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    const storedUser =
      localStorage.getItem("user") || sessionStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  /* const login = (token: string, user: User, remember = false) => {
  //   if (remember) {
  //     localStorage.setItem("token", token);
  //     localStorage.setItem("user", JSON.stringify(user));
  //   } else {
  //     sessionStorage.setItem("token", token);
  //     sessionStorage.setItem("user", JSON.stringify(user));
  //   }

  //   setToken(token);
  //   setUser(user);
  }; */

  const login = (newToken: string, newUser: User, remember = false) => {
  // Clear any existing auth data first
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");

  const storage = remember ? localStorage : sessionStorage;

  storage.setItem("token", newToken);
  storage.setItem("user", JSON.stringify(newUser));

  setToken(newToken);
  setUser(newUser);
};


  const updateUser = (patch: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      // Write back to whichever storage currently holds the user
      if (localStorage.getItem("user")) {
        localStorage.setItem("user", JSON.stringify(updated));
      } else {
        sessionStorage.setItem("user", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    setToken(null);
    setUser(null);

    // Destroy the shared socket so it reconnects with a fresh token on next login
    disconnectSocket();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
