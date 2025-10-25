"use client";

import { useStore } from "@/hooks/use-store";
import { clearCache } from "@/utility";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

export const useLogout = () => {
  const [loading, setLoading] = useState(false);
  const { unsetAuth } = useStore();
  const router = useRouter();

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await unsetAuth();
    } catch (error) {
      console.error("Logout failed:", error);
    }
    finally {
      setLoading(false);
      router.push("/login");
      clearCache();
    }
  }, [unsetAuth, router, clearCache]);

  return { logout, loading };
};
