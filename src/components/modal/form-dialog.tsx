import { useRef, type ComponentProps, type ReactNode } from "react";
import { X } from "lucide-react";
import Spinner from "@/components/spinner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/utility";

const fieldClass =
  "rounded-lg border-stroke-neutral-weak bg-fill-neutral-weak text-base text-text-neutral-strong shadow-none placeholder:text-text-neutral-weaker";

/** Standard modal layout: title and close button, stacked fields, then Dismiss and a primary action. */
export function FormDialog({
  title,
  description,
  onClose,
  busy = false,
  children,
}: {
  title: string;
  /** Read by screen readers only; the layout has no visible subtitle. */
  description: string;
  onClose: () => void;
  busy?: boolean;
  children: ReactNode;
}) {
  const returnFocusRef = useRef(document.activeElement as HTMLElement | null);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="z-[120] block max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl bg-popover p-6 font-rounded text-text-neutral-strong [--font-geist:var(--font-rounded)] [--font-inter:var(--font-rounded)] sm:max-w-[456px] motion-reduce:animate-none"
        overlayClassName="z-[115] bg-overlay-backdrop supports-backdrop-filter:backdrop-blur-none motion-reduce:animate-none"
        onOpenAutoFocus={(event) => {
          const field = event.currentTarget instanceof HTMLElement
            ? event.currentTarget.querySelector<HTMLElement>("input:not([type='hidden']), textarea")
            : null;
          if (!field) return;
          event.preventDefault();
          field.focus();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus();
        }}
      >
        <div className="mb-6 flex items-center justify-between gap-3">
          <DialogTitle className="font-rounded text-2xl font-semibold text-text-neutral-strong">
            {title}
          </DialogTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close"
            disabled={busy}
            className="rounded-full bg-fill-neutral-weak text-icon-neutral-strong"
            onClick={onClose}
          >
            <X aria-hidden />
          </Button>
        </div>
        <DialogDescription className="sr-only">{description}</DialogDescription>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export function FormDialogField({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label
        htmlFor={htmlFor}
        className="text-sm font-normal text-text-neutral-strong"
      >
        {label}
      </Label>
      {children}
      {error ? (
        <span className="text-xs text-text-error-strong">{error}</span>
      ) : null}
    </div>
  );
}

export function FormDialogInput({
  className,
  ...props
}: ComponentProps<typeof Input>) {
  return <Input className={cn("h-12 px-3.5", fieldClass, className)} {...props} />;
}

/** Shows a value in a field's frame when it can't be changed. */
export function FormDialogValue({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  return (
    <output id={id} className={cn("block border px-3.5 py-3", fieldClass)}>
      {children}
    </output>
  );
}

export function FormDialogTextarea({
  className,
  ...props
}: ComponentProps<typeof Textarea>) {
  return (
    <Textarea
      className={cn("min-h-24 resize-none px-3.5 py-3", fieldClass, className)}
      {...props}
    />
  );
}

export function FormDialogFooter({
  submitLabel,
  busyLabel,
  busy = false,
  disabled = false,
  onDismiss,
  onSubmit,
  leading,
  dismissLabel = "Dismiss",
  destructive = false,
}: {
  submitLabel: string;
  busyLabel: string;
  busy?: boolean;
  disabled?: boolean;
  onDismiss: () => void;
  /** Defaults to submitting the surrounding form. */
  onSubmit?: () => void;
  leading?: ReactNode;
  /** Pass null when the close button is the only way to dismiss. */
  dismissLabel?: string | null;
  destructive?: boolean;
}) {
  return (
    <div className="mt-2 flex flex-wrap items-center justify-end gap-3">
      {leading ? <div className="mr-auto">{leading}</div> : null}
      {dismissLabel ? (
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-full border-stroke-neutral-weak bg-transparent px-7 text-base font-semibold text-text-neutral-strong"
          disabled={busy}
          onClick={onDismiss}
        >
          {dismissLabel}
        </Button>
      ) : null}
      <Button
        type={onSubmit ? "button" : "submit"}
        variant={destructive ? "destructive" : undefined}
        className={cn(
          "h-12 rounded-full px-5 text-base font-semibold",
          destructive &&
            "bg-[color:var(--fill-error-solid)] hover:bg-[color:var(--fill-error-solid)]/90",
        )}
        disabled={busy || disabled}
        onClick={onSubmit}
      >
        {busy ? (
          <>
            {busyLabel} <Spinner className="!size-4" loading />
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </div>
  );
}
