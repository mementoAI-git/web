import type { ReactNode } from "react";
import { DialRoot } from "dialkit";

/**
 * Top-level app chrome: DialKit as a sibling of the router tree (does not wrap children).
 */
export function RootAppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <DialRoot />
      {children}
    </>
  );
}
