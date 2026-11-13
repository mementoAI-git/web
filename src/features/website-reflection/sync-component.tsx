import { useEffect } from "react";
import { syncWebsiteReflection } from "./sync";

/** Mounted inside the authenticated dashboard. */
export function WebsiteReflectionSync() {
  useEffect(() => {
    void syncWebsiteReflection();
  }, []);
  return null;
}
