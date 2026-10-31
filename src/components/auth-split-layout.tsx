import { ThemeSwitcher } from "@/components/theme-switcher";
import type { PropsWithChildren } from "react";
import authHeroCoastal from "@/assets/image/auth/auth-hero-coastal.png";
import { Badge } from "@/components/ui/badge";
import Logo from "@/components/logo";
import { cn } from "@/lib/utils";

const authCenteredHeroAlt = "Person standing near a scenic coastline";

/** Hero column for the centered auth card (signup-style shell). Hidden below `md`. */
function AuthCenteredHeroAside() {
  return (
    <aside className="relative hidden min-h-[560px] w-[378px] shrink-0 overflow-hidden rounded-2xl md:block">
      <img
        src={authHeroCoastal}
        alt={authCenteredHeroAlt}
        className="absolute inset-0 size-full object-cover"
        loading="lazy"
        decoding="async"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-black/10"
        aria-hidden
      />
    </aside>
  );
}

/**
 * Centered two-column auth shell: top logo, rounded section with coastal hero + form column.
 * Used by {@link AuthLayout} and the signup choice page.
 */
export function AuthCenteredSplitShell({ children }: PropsWithChildren) {
  return (
    <div className="flex h-dvh flex-col overflow-y-auto bg-bg-neutral px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
      <header className="mx-auto flex w-full shrink-0 items-center justify-between gap-4">
        <Logo className="text-foreground" />
        <ThemeSwitcher className="size-10 shrink-0 rounded-full bg-fill-neutral-weak hover:bg-fill-neutral-weaker" />
      </header>

      <main className="mx-auto flex w-full flex-1 items-center justify-center py-6 sm:py-8 lg:py-12">
        <section className="flex w-full max-w-4xl gap-6 rounded-3xl">
          <AuthCenteredHeroAside />
          <div className="flex min-w-0 w-full flex-col items-start justify-center p-6 sm:p-8 md:w-[420px] md:p-10">
            {children}
          </div>
        </section>
      </main>
    </div>
  );
}

function AuthMarketingPanel({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "relative order-2 hidden min-h-0 flex-col justify-between overflow-hidden lg:flex lg:order-none lg:min-h-dvh lg:basis-3/5 lg:shrink-0",
        className,
      )}
    >
      <img
        src={authHeroCoastal}
        alt="Illustration of a winding green shoreline beside turquoise water, with small colorful figures along a bright beach."
        className="absolute inset-0 size-full object-cover object-[52%_32%]"
        loading="lazy"
        decoding="async"
      />
      {/* Readability scrim — image is light on the right; copy sits on the left over water */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent"
        aria-hidden
      />

      <div className="relative z-10 flex flex-col gap-6 px-10 py-10 text-text-inverse-strong lg:max-w-md lg:gap-7">
        <Logo className="text-text-inverse-strong drop-shadow-md" />
        <Badge
          variant="outline"
          className="h-5 w-fit border-stroke-inverse-strong bg-overlay-backdrop/40 px-2 text-[11px] text-text-inverse-strong backdrop-blur-sm hover:bg-overlay-backdrop/60"
        >
          Stories that last
        </Badge>
        <div className="space-y-3">
          <h1 className="font-garamond text-[2rem] font-normal leading-[1.15] text-text-inverse-strong drop-shadow-sm lg:text-[2.25rem] lg:leading-[1.1]">
            Preserve what matters.
          </h1>
          <p className="max-w-sm font-inter text-sm leading-relaxed text-text-inverse-weak drop-shadow-sm">
            Shape memories, share chapters with people you trust, and keep your narrative alive on Memento.
          </p>
        </div>
      </div>

      {/* Spacer so bottom of panel breathes on tall screens */}
      <div className="relative z-10 hidden min-h-8 lg:block" aria-hidden />
    </aside>
  );
}

/** Full-viewport auth shell: marketing panel + scrollable form column. Form column is first on mobile. */
export function AuthSplitShell({ children }: PropsWithChildren) {
  return (
    <div className="relative h-dvh overflow-y-auto bg-background">
      <header className="absolute right-4 top-5 sm:right-6">
        <ThemeSwitcher className="size-10 shrink-0 rounded-full bg-fill-neutral-weak hover:bg-fill-neutral-weaker" />
      </header>
      <div className="flex min-h-dvh flex-col lg:flex-row">
        <div className="order-1 flex flex-1 flex-col lg:order-none lg:min-h-dvh lg:basis-2/5 lg:overflow-y-auto">
          <div className="shrink-0 px-4 pt-5 sm:px-6 lg:hidden">
            <Logo />
          </div>
          <div className="flex flex-1 flex-col justify-center px-4 py-6 sm:px-6 sm:py-8 lg:px-10 xl:px-12">
            <div className="mx-auto w-full max-w-[420px]">{children}</div>
          </div>
        </div>
        <AuthMarketingPanel />
      </div>
    </div>
  );
}
