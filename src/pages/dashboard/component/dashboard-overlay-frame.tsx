import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/utility";
import { DashboardSideBar } from "./dashboard-sidebar";

const OverlaySidebarContext = createContext<{
  expanded: boolean;
  expand: () => void;
} | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useOverlaySidebar = () => useContext(OverlaySidebarContext);

/**
 * Gives full-screen pages the main sidebar, behaving as it does in the
 * dashboard layout: it pushes the page over on desktop and covers it on mobile.
 */
export function DashboardOverlayFrame({ children }: PropsWithChildren) {
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // Each state hides the control that was just used, so focus has to move.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const next = expanded
      ? sidebarRef.current?.querySelector<HTMLElement>(
          '[aria-label="Collapse sidebar"]',
        )
      : contentRef.current?.querySelector<HTMLElement>("[data-sidebar-toggle]");
    next?.focus();
  }, [expanded]);

  return (
    <OverlaySidebarContext.Provider
      value={{ expanded, expand: () => setExpanded(true) }}
    >
      <div className="flex min-h-0 w-full flex-1">
        <div
          ref={sidebarRef}
          inert={!expanded}
          className={cn(
            expanded ? "translate-x-0" : "-translate-x-full md:translate-x-0",
            "fixed inset-y-0 left-0 z-50 md:relative md:z-auto",
            "navigation-sidebar overlay-sidebar w-full shrink-0 md:w-[280px]",
            !expanded && "md:!w-0 md:!min-w-0 md:overflow-hidden md:opacity-0",
          )}
          onClick={(event) => {
            const target = event.target as HTMLElement;
            if (
              isMobile &&
              target.closest('[data-slot="sidebar-menu-button"]')
            )
              setExpanded(false);
          }}
        >
          <DashboardSideBar
            onCollapse={() => setExpanded(false)}
            profileMenuClassName="z-[120]"
          />
        </div>
        <div
          ref={contentRef}
          className="flex min-w-0 flex-1 flex-col overflow-hidden"
        >
          {children}
        </div>
      </div>
    </OverlaySidebarContext.Provider>
  );
}
