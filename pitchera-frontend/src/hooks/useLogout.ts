import { useCallback } from "react";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export function useLogout() {
  const { logout } = useAuth();

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } finally {
      router.replace("/");
    }
  }, [logout]);

  return {
    logout: handleLogout,
  };
}