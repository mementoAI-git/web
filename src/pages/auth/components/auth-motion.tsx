import {
  useEffect,
  useRef,
  type PropsWithChildren,
} from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import "./auth-motion.css";

export { MotionHeading as AuthMotionHeading } from "@/components/motion/text-reveal";

/** Error validity stays owned by the form; only the brief visual feedback ends. */
export function AuthFieldMotion({
  error,
  className,
  children,
}: PropsWithChildren<{ error?: string; className?: string }>) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const field = ref.current;
    if (!field || !error) return;
    field.classList.remove("is-shaking");
    void field.offsetWidth;
    field.classList.add("is-shaking");
    const styles = getComputedStyle(document.documentElement);
    const duration = (name: string, fallback: number) => {
      const value = parseFloat(styles.getPropertyValue(name));
      return Number.isFinite(value) ? value : fallback;
    };
    const timer = window.setTimeout(
      () => field.classList.remove("is-shaking"),
      duration("--shake-dur-a", 80) * 2 +
        duration("--shake-dur-b", 60) * 2 +
        20,
    );
    return () => {
      window.clearTimeout(timer);
      field.classList.remove("is-shaking");
    };
  }, [error]);
  return (
    <div ref={ref} className={cn("t-input", error && "is-error", className)}>
      {children}
    </div>
  );
}

export function PasswordVisibilityIcon({ visible }: { visible: boolean }) {
  return (
    <span
      className="t-icon-swap"
      data-state={visible ? "b" : "a"}
      aria-hidden="true"
    >
      <span className="t-icon" data-icon="a">
        <Eye className="size-4 shrink-0" strokeWidth={2} />
      </span>
      <span className="t-icon" data-icon="b">
        <EyeOff className="size-4 shrink-0" strokeWidth={2} />
      </span>
    </span>
  );
}
