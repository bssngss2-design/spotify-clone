"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";

function isBrowserOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

function isNetworkAuthFailure(reason: unknown): boolean {
  const msg = String(
    (reason as { message?: string })?.message || reason || ""
  );
  const stack = String((reason as { stack?: string })?.stack || "");
  return (
    /failed to fetch|networkerror|load failed|network request failed/i.test(
      msg
    ) &&
    (/supabase|gothrue|_signout|auth-js|gotrue/i.test(stack) ||
      /supabase|gothrue|_signout|auth-js|gotrue/i.test(msg))
  );
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const userRef = useRef<User | null>(null);
  const sessionRef = useRef<Session | null>(null);

  useEffect(() => {
    userRef.current = user;
    sessionRef.current = session;
  }, [user, session]);

  useEffect(() => {
    let cancelled = false;

    supabase.auth
      .getSession()
      .then(({ data: { session: s } }) => {
        if (cancelled) return;
        setSession(s);
        setUser(s?.user ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      // Offline / flaky network: never wipe a known-good local session
      if (!nextSession && isBrowserOffline() && sessionRef.current) {
        return;
      }

      if (event === "SIGNED_OUT") {
        // Refresh/signOut often fails offline and emits SIGNED_OUT — verify storage
        void supabase.auth.getSession().then(({ data }) => {
          if (cancelled) return;
          if (data.session) {
            setSession(data.session);
            setUser(data.session.user);
            return;
          }
          if (isBrowserOffline() && sessionRef.current) {
            return;
          }
          setSession(null);
          setUser(null);
          setLoading(false);
        });
        return;
      }

      if (
        !nextSession &&
        (event === "TOKEN_REFRESHED" || event === "USER_UPDATED")
      ) {
        return;
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    const onOnline = () => {
      supabase.auth
        .getSession()
        .then(({ data: { session: s } }) => {
          if (s) {
            setSession(s);
            setUser(s.user);
          }
        })
        .catch(() => {});
    };

    // Prevent Next.js red overlay when Supabase auth fetch fails offline
    const onUnhandled = (e: PromiseRejectionEvent) => {
      if (isNetworkAuthFailure(e.reason)) {
        e.preventDefault();
      }
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("unhandledrejection", onUnhandled);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.removeEventListener("online", onOnline);
      window.removeEventListener("unhandledrejection", onUnhandled);
    };
  }, [supabase.auth]);

  const signUp = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { data, error };
    },
    [supabase.auth]
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    },
    [supabase.auth]
  );

  const signOut = useCallback(async () => {
    // Prefer local scope so offline / flaky Wi‑Fi doesn't throw Failed to fetch
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // ignore network errors — we still clear local state below
    }
    setSession(null);
    setUser(null);
    return { error: null };
  }, [supabase.auth]);

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };
}
