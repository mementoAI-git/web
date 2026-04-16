/**
 * Dev-only admin tools for previewing empty states.
 * Gated behind import.meta.env.DEV — tree-shaken from production builds.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { SWRConfig } from "swr";
import type { Middleware } from "swr";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface DevAdminContextValue {
  forceEmpty: boolean;
  toggle: () => void;
}

const DevAdminContext = createContext<DevAdminContextValue>({
  forceEmpty: false,
  toggle: () => {},
});

// eslint-disable-next-line react-refresh/only-export-components
export const useDevAdmin = () => useContext(DevAdminContext);

// ---------------------------------------------------------------------------
// SWR middleware — reads a module-level flag on every render so it stays
// reactive without needing to re-create the middleware function.
// ---------------------------------------------------------------------------

let _forceEmpty = false;

const forceEmptyMiddleware: Middleware = (useSWRNext) => (key, fetcher, config) => {
  const swr = useSWRNext(key, fetcher, config);
  if (_forceEmpty && key) {
    return { ...swr, data: undefined };
  }
  return swr;
};

// ---------------------------------------------------------------------------
// Provider — wrap inside the existing <SWRConfig> in main.tsx.
// Nests a second SWRConfig whose `use` array injects the middleware.
// ---------------------------------------------------------------------------

export function DevAdminProvider({ children }: { children: ReactNode }) {
  const [forceEmpty, setForceEmpty] = useState(false);

  const toggle = useCallback(() => {
    setForceEmpty((prev) => {
      _forceEmpty = !prev;
      return !prev;
    });
  }, []);

  // Keyboard shortcut: Ctrl+Shift+E
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "E") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  return (
    <DevAdminContext.Provider value={{ forceEmpty, toggle }}>
      <SWRConfig value={{ use: [forceEmptyMiddleware] }}>
        {children}
        <DevAdminToolbar />
      </SWRConfig>
    </DevAdminContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Floating toolbar — fixed to bottom-left, minimal footprint.
// ---------------------------------------------------------------------------

function DevAdminToolbar() {
  const { forceEmpty, toggle } = useDevAdmin();
  const [collapsed, setCollapsed] = useState(true);

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="fixed bottom-3 left-3 z-[99999] flex size-8 items-center justify-center rounded-full bg-gray-900 text-[11px] text-white shadow-lg transition-transform hover:scale-110"
        title="Dev Admin Tools (Ctrl+Shift+E to toggle empty states)"
      >
        {forceEmpty ? (
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-amber-500" />
          </span>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/></svg>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-3 left-3 z-[99999] flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-2xl font-inter text-xs select-none"
      style={{ minWidth: 200 }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold text-gray-900 text-[11px] uppercase tracking-wider">
          Dev Admin
        </span>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="flex size-5 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Collapse"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>

      <button
        type="button"
        onClick={toggle}
        className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-2.5 py-2 transition-colors hover:bg-gray-50"
      >
        <div className="flex flex-col items-start gap-0.5">
          <span className="text-[11px] font-medium text-gray-700">Force empty states</span>
          <span className="text-[10px] text-gray-400">Ctrl+Shift+E</span>
        </div>
        {/* Toggle switch */}
        <div
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
            forceEmpty ? "bg-amber-500" : "bg-gray-200"
          }`}
        >
          <span
            className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition-transform ${
              forceEmpty ? "translate-x-[17px]" : "translate-x-[1px]"
            } mt-[2px]`}
          />
        </div>
      </button>

      {forceEmpty && (
        <div className="flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1.5 text-[10px] text-amber-700">
          <span className="inline-block size-1.5 rounded-full bg-amber-500" />
          All data hidden — showing empty states
        </div>
      )}
    </div>
  );
}
