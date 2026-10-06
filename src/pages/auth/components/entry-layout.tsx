import type { PropsWithChildren, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/logo";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { useTheme } from "@/contexts/theme";
import gradientLight from "@/assets/image/auth/gradient-light.svg";
import recoveryGradient from "@/assets/image/auth/recovery-gradient.svg";
import gradientDark from "@/assets/image/auth/gradient-dark.svg";
import sparkle from "@/assets/image/auth/sparkle.svg";
import monogram from "@/assets/image/auth/monogram.svg";
import topic from "@/assets/image/auth/topic.webp";
import journal from "@/assets/image/auth/journal.webp";
import beneficiaries from "@/assets/image/auth/beneficiaries.webp";
import chat from "@/assets/image/auth/chat.webp";
import voice from "@/assets/image/auth/voice.webp";
import avatar1 from "@/assets/image/auth/avatar-1.webp";
import avatar2 from "@/assets/image/auth/avatar-2.webp";
import avatar3 from "@/assets/image/auth/avatar-3.webp";

const features = [
  { image: journal, label: "Journal and read insights", slot: "journal" },
  {
    image: beneficiaries,
    label: "Invite beneficiaries",
    slot: "beneficiaries",
  },
  { image: chat, label: "AI Chat", slot: "chat" },
  { image: voice, label: "Voice mode conversation", slot: "voice" },
];

function EntryIllustration({ recovery }: { recovery: boolean }) {
  const { resolvedTheme } = useTheme();
  return (
    <aside
      className="auth-entry-illustration"
      aria-label="Capture the little things with Memento"
    >
      <img
        className={cn(
          "auth-entry-gradient",
          recovery &&
            resolvedTheme !== "dark" &&
            "auth-entry-recovery-gradient",
        )}
        src={
          resolvedTheme === "dark"
            ? gradientDark
            : recovery
              ? recoveryGradient
              : gradientLight
        }
        alt=""
      />
      <div className="auth-entry-art" aria-hidden="true">
        <img className="auth-entry-sparkle" src={sparkle} alt="" />
        <div className="auth-entry-prompt">
          <div className="flex items-center justify-between">
            <span className="auth-entry-prompt-tag">
              Relationships &amp; People
            </span>
            <ChevronDown size={8} />
          </div>
          <div className="mt-2 flex items-start gap-2">
            <p>
              What habits do your friends or family have that you find endearing
              or funny?
            </p>
            <img
              src={topic}
              alt=""
              className="size-[18px] rounded-[3px] object-cover"
            />
          </div>
        </div>
        {features.map(({ image, label, slot }) => (
          <div
            key={slot}
            className={`auth-entry-feature auth-entry-feature-${slot}`}
          >
            <div className="auth-entry-feature-image">
              <img src={image} alt="" />
            </div>
            <span>{label}</span>
          </div>
        ))}
        <img className="auth-entry-monogram" src={monogram} alt="" />
      </div>
      <div className="auth-entry-caption">
        <p className="font-garamond text-[24px] font-medium leading-8 text-text-neutral-strong">
          Don’t let the <mark>little</mark>
          <br />
          <mark>things</mark> disappear.
        </p>
        <p className="mt-4 text-xs text-text-neutral-weak">
          Get started on Memento AI
        </p>
        <div
          className="mt-3 flex justify-center [&>img+img]:-ml-2"
          aria-hidden="true"
        >
          {[avatar1, avatar2, avatar3].map((src) => (
            <img
              key={src}
              src={src}
              alt=""
              className="size-8 rounded-full border-2 border-bg-neutral object-cover"
            />
          ))}
        </div>
      </div>
    </aside>
  );
}

export default function AuthEntryLayout({
  children,
  title,
  subtitle,
  footer,
  legal,
  recovery = false,
}: PropsWithChildren<{
  title: ReactNode;
  subtitle?: ReactNode;
  footer?: ReactNode;
  recovery?: boolean;
  legal?: ReactNode;
}>) {
  return (
    <div className="auth-entry min-h-dvh bg-bg-neutral font-geist text-text-neutral-strong">
      <header className="auth-entry-header flex items-center justify-between">
        <Logo className="auth-entry-logo text-text-neutral-strong" />
        <ThemeSwitcher />
      </header>
      <main
        className={cn(
          "auth-entry-main",
          legal && "auth-entry-main-signup",
          recovery && "auth-entry-main-recovery",
        )}
      >
        <EntryIllustration recovery={recovery} />
        <section className="auth-entry-form" aria-labelledby="auth-entry-title">
          {recovery && (
            <Link
              to="/login"
              className="mb-6 inline-flex min-h-8 items-center gap-2 rounded-md text-sm font-medium hover:underline"
            >
              <ArrowLeft className="size-5" aria-hidden />
              Back to login
            </Link>
          )}
          <header className="auth-entry-heading flex flex-col gap-2">
            <h1
              id="auth-entry-title"
              className="font-garamond text-[32px] font-medium leading-10"
            >
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-text-neutral-weak">{subtitle}</p>
            )}
          </header>
          <div className="auth-entry-fields flex flex-col gap-5">
            {children}
          </div>
          {footer && (
            <div className="auth-entry-footer mt-2 flex min-h-11 items-center justify-center text-center text-sm font-semibold">
              {footer}
            </div>
          )}
          {legal && (
            <div className="auth-entry-legal mx-auto mt-6 max-w-[360px] text-center text-xs leading-[18px] text-text-neutral-weak">
              {legal}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
