import { useCallback, useEffect, useState } from "react";
import { api, setUnauthorizedHandler } from "../api";
import type { Me } from "../types";

export function useAuth() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearSession = useCallback(() => {
    setMe(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  useEffect(() => {
    let cancelled = false;
    api<Me>("/me")
      .then((data) => {
        if (!cancelled) setMe(data);
      })
      .catch(() => {
        if (!cancelled) setMe(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      setError(null);
      const data = await api<Me>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      setMe(data);
    },
    [],
  );

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    const data = await api<Me>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setMe(data);
  }, []);

  const logout = useCallback(async () => {
    await api("/auth/logout", { method: "POST" });
    setMe(null);
  }, []);

  const createTeam = useCallback(async (name: string) => {
    setError(null);
    const data = await api<Me>("/teams", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    setMe(data);
  }, []);

  const joinTeam = useCallback(async (inviteCode: string) => {
    setError(null);
    const data = await api<Me>("/teams/join", {
      method: "POST",
      body: JSON.stringify({ inviteCode }),
    });
    setMe(data);
  }, []);

  return {
    me,
    loading,
    error,
    setError,
    register,
    login,
    logout,
    createTeam,
    joinTeam,
  };
}
