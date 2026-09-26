import { createContext, useContext, useEffect, useState } from "react";
import * as authService from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = not yet resolved
  const [productsMeta] = useState({});

  useEffect(() => {
    setUser(authService.getSession());
  }, []);

  async function login(email, password) {
    const session = await authService.login(email, password);
    setUser(session);
    return session;
  }

  async function signup(data) {
    const session = await authService.signup(data);
    setUser(session);
    return session;
  }

  function logout() {
    authService.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, ready: user !== undefined }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
