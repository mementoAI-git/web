"use client";

import { useStore } from "@/hooks/use-store";
import { clearCache } from "@/utility";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

export const useLogout = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { unsetAuth } = useStore();

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await unsetAuth?.();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
      clearCache();
      navigate("/login");
    }
  }, [navigate, unsetAuth]);

  return { logout, loading };
};

