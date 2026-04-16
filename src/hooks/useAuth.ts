"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

interface User {
  id: string;
  email: string;
}

interface AuthState {
  user: User | null;
  session: boolean;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ user: null, session: false, loading: true });

  useEffect(() => {
    const token = api.getToken();
    if (!token) {
      setState({ user: null, session: false, loading: false });
      return;
    }
    api.get<User>("/api/auth/me")
      .then((user) => setState({ user, session: true, loading: false }))
      .catch(() => {
        api.clearToken();
        setState({ user: null, session: false, loading: false });
      });
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const data = await api.post<{ access_token: string; user: User }>("/api/auth/login", { email, password });
      api.setToken(data.access_token);
      setState({ user: data.user, session: true, loading: false });
      return { error: null };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      const message =
        msg === "Failed to fetch" || msg === "Load failed"
          ? "API unreachable — is FastAPI running? Check BACKEND_URL matches the backend port."
          : msg || "Login failed";
      return { error: { message } };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      const data = await api.post<{ access_token: string; user: User }>("/api/auth/register", { email, password });
      api.setToken(data.access_token);
      setState({ user: data.user, session: true, loading: false });
      return { error: null, data: { user: data.user, session: true } };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      const message =
        msg === "Failed to fetch" || msg === "Load failed"
          ? "API unreachable — is FastAPI running? Check BACKEND_URL matches the backend port."
          : msg || "Signup failed";
      return { error: { message }, data: { user: null, session: null } };
    }
  }, []);

  const signOut = useCallback(() => {
    api.clearToken();
    setState({ user: null, session: false, loading: false });
    window.location.href = "/login";
  }, []);

  return { ...state, signIn, signUp, signOut };
}
