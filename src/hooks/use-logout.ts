"use client";

import { useStore } from "@/hooks/use-store";
import { authService } from "@/utility/auth-service";
import { clearCache } from "@/utility";
import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export const useLogout = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { unsetAuth } = useStore();

  const pending = useRef(false);
  const logout = useCallback(async (options: { allDevices?: boolean; localOnly?: boolean } = {}) => {
    if (pending.current) return;
    pending.current = true;
    try {
      setLoading(true);
      if (options.allDevices) await authService.logoutAllDevices();
      else if (options.localOnly) authService.clearAuth();
      else await unsetAuth?.();
      await clearCache().catch(() => undefined);
      navigate("/login", { replace: true });
    } finally {
      pending.current = false;
      setLoading(false);
    }
  }, [navigate, unsetAuth]);

  return { logout, loading };
};

