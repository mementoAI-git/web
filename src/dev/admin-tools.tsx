/**
 * Dev-only admin tools for previewing empty states.
 * Gated behind import.meta.env.DEV — tree-shaken from production builds.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { SWRConfig, useSWRConfig } from "swr";
import { StoreValueProvider, useStore } from "@/hooks/use-store";
import {
  PreviewSession,
  getPreviewSession,
  setPreviewSession,
} from "./preview-session";
import {
  installPreviewFetch,
  installPreviewStorage,
} from "./preview-transport";
import "./admin-tools.css";

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
// The preview owns temporary API records, cache, profile, and drafts.
// ---------------------------------------------------------------------------

interface PreviewRouter {
  state: { location: { pathname: string; search: string; hash: string } };
  navigate: (
    to: string,
    options?: { replace?: boolean },
  ) => void | Promise<void>;
  subscribe: (listener: () => void) => () => void;
}

function PreviewCacheRefresh({ session }: { session: PreviewSession }) {
  const { mutate } = useSWRConfig();
  // App code also calls global mutate; supported writes notify this isolated
  // cache directly so counts and lists update without touching the real cache.
  useEffect(
    () =>
      session.subscribe(() => {
        void mutate(() => true);
      }),
    [session, mutate],
  );
  return null;
}

function PreviewContent({
  session,
  children,
}: {
  session: PreviewSession;
  children: ReactNode;
}) {
  const store = useStore();
  useSyncExternalStore(session.subscribe, () => session.revision);
  const cache = useMemo(() => new Map(), []);
  const value = { ...store, user: session.user, setUser: () => {} };
  return (
    <StoreValueProvider value={value}>
      <SWRConfig value={{ provider: () => cache }}>
        <PreviewCacheRefresh session={session} />
        {children}
      </SWRConfig>
    </StoreValueProvider>
  );
}

// ---------------------------------------------------------------------------
// Provider — wrap inside the existing <SWRConfig> in main.tsx.
// The keyed content remounts on each mode change; the toolbar keeps its focus.
// ---------------------------------------------------------------------------

export function DevAdminProvider({
  children,
  router,
}: {
  children: ReactNode;
  router?: PreviewRouter;
}) {
  const { user } = useStore();
  const [session, setSession] = useState<PreviewSession | null>(null);
  const [generation, setGeneration] = useState(0);
  const savedPath = useRef<string | null>(null);
  const forceEmpty = session !== null;

  useEffect(() => {
    const restoreFetch = installPreviewFetch();
    const restoreStorage = installPreviewStorage();
    return () => {
      getPreviewSession()?.dispose();
      setPreviewSession(null);
      restoreFetch();
      restoreStorage();
    };
  }, []);

  const toggle = useCallback(() => {
    const previous = getPreviewSession();
    if (!previous && !user) return;
    const next = previous ? null : new PreviewSession(user);
    const location = router?.state.location;
    if (next && location) {
      savedPath.current = `${location.pathname}${location.search}${location.hash}`;
      if (/^\/chat(?:\/|$)/.test(location.pathname))
        void router.navigate("/chat/new", { replace: true });
      else if (/^\/stories\//.test(location.pathname))
        void router.navigate("/stories", { replace: true });
    }
    setPreviewSession(next);
    setSession(next);
    setGeneration((value) => value + 1);
    if (!next && location) {
      if (/^\/chat(?:\/|$)/.test(location.pathname)) {
        void router.navigate(
          savedPath.current?.startsWith("/chat") ? savedPath.current : "/chat",
          { replace: true },
        );
      } else if (location.pathname.includes("/preview-"))
        void router.navigate("/stories", { replace: true });
    }
    previous?.dispose();
  }, [router, user]);

  useEffect(() => {
    if (!session || !router) return;
    return router.subscribe(() => {
      if (getPreviewSession() !== session) return;
      const path = router.state.location.pathname;
      // Back/forward or a stale link must not re-open the real account's thread.
      if (
        /^\/chat\/[^/]+(?:\/voice)?$/.test(path) &&
        !path.startsWith("/chat/reply") &&
        path !== "/chat/new" &&
        !path.startsWith("/chat/preview-")
      ) {
        void router.navigate(
          session.user.primary_conversation_id
            ? `/chat/${session.user.primary_conversation_id}`
            : "/chat/new",
          { replace: true },
        );
      }
    });
  }, [session, router]);

  // Keyboard shortcut: Ctrl+Shift+E
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.repeat && e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "e") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  return (
    <DevAdminContext.Provider value={{ forceEmpty, toggle }}>
      <div key={generation} className="contents">
        {session ? (
          <PreviewContent session={session}>{children}</PreviewContent>
        ) : (
          children
        )}
      </div>
      <DevAdminToolbar enabled={Boolean(user)} />
    </DevAdminContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Floating toolbar — fixed to bottom-left, minimal footprint.
// ---------------------------------------------------------------------------

function DevAdminToolbar({ enabled }: { enabled: boolean }) {
  const { forceEmpty, toggle } = useDevAdmin();
  const [collapsed, setCollapsed] = useState(true);
  const [interacted, setInteracted] = useState(false);

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="dev-admin-trigger fixed bottom-3 left-3 z-[99999] flex size-8 items-center justify-center rounded-full bg-fill-neutral-strong text-[11px] text-text-inverse-strong shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-brand-strong"
        aria-label="Dev Admin Tools"
        title="Dev Admin Tools (Ctrl+Shift+E to toggle new user preview)"
      >
        {forceEmpty ? (
          <span className="relative flex size-2.5">
            <span className="relative inline-flex size-2.5 rounded-full bg-fill-warning-strong" />
          </span>
        ) : (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 20h9" />
            <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
          </svg>
        )}
      </button>
    );
  }

  return (
    <div
      className="dev-admin-toolbar fixed bottom-3 left-3 z-[99999] flex flex-col gap-2 rounded-xl border border-stroke-neutral-weak bg-bg-neutral p-3 shadow-2xl font-inter text-xs select-none"
      style={{ minWidth: 200 }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold text-text-neutral-strong text-[11px] uppercase tracking-wider">
          Dev Admin
        </span>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="flex size-5 items-center justify-center rounded text-icon-neutral-weak hover:bg-fill-neutral-weak hover:text-icon-neutral-strong"
          aria-label="Collapse"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={forceEmpty}
        aria-label="New user preview"
        disabled={!enabled}
        onClick={() => {
          setInteracted(true);
          toggle();
        }}
        className="flex items-center justify-between gap-3 rounded-lg border border-stroke-neutral-weak px-2.5 py-2 hover:bg-fill-neutral-weak disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-brand-strong"
      >
        <div className="flex flex-col items-start gap-0.5">
          <span className="text-[11px] font-medium text-text-neutral-strong">
            New user preview
          </span>
          <span className="text-[10px] text-text-neutral-weak">
            Ctrl+Shift+E
          </span>
        </div>
        {/* Toggle switch */}
        <div
          data-on={forceEmpty}
          aria-hidden="true"
          className={`t-toggle ${interacted ? "is-init" : ""} relative inline-flex h-5 w-9 shrink-0 rounded-full ${
            forceEmpty ? "bg-fill-warning-strong" : "bg-fill-neutral-weak"
          }`}
        >
          <span className="t-toggle-thumb pointer-events-none ml-px mt-[2px] inline-block size-4 rounded-full bg-bg-neutral shadow ring-0" />
        </div>
      </button>

      {forceEmpty && (
        <div className="flex items-center gap-1.5 rounded-md bg-fill-warning-weak px-2 py-1.5 text-[10px] text-text-warning-strong">
          <span className="inline-block size-1.5 rounded-full bg-fill-warning-strong" />
          Fresh account · actions stay local
        </div>
      )}
    </div>
  );
}
