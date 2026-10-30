import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { reportFetcherError } from "@/api/report-fetcher-error";
import { cancelSubscription } from "./subscription-actions";
import posthog from "@/lib/posthog";

const reasons = [
  ["expensive", "It’s too expensive", "too_expensive"],
  ["unused", "I’m not using Memento enough", "unused"],
  ["features", "I don’t need the Pro features", "other"],
  ["privacy", "I’m concerned about privacy", "other"],
  ["break", "I’m taking a break", "other"],
  ["other", "Something else", "other"],
] as const;

export function CancelPlanContent({
  onBack,
  onComplete,
  onBusyChange,
}: {
  onBack: () => void;
  onComplete: () => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [step, setStep] = useState<"confirm" | "reason">("confirm");
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const selected = reasons.find(([id]) => id === reason);
    if (!selected || pending.current) return;
    pending.current = true;
    onBusyChange?.(true);
    setBusy(true);
    try {
      const response = await cancelSubscription({
        reason: selected[2],
        comment: [selected[1], comment.trim()].filter(Boolean).join("\n"),
      });
      if (!response.success)
        throw new Error(response.message || "Could not cancel your plan");
      if (posthog.__loaded) {
        posthog.capture("subscription_cancelled", {
          cancellation_reason: selected[2],
        });
      }
      toast.success(
        "Cancellation scheduled. Your Pro access continues until the end of your billing period.",
      );
      onComplete();
    } catch (error) {
      reportFetcherError(error, "Could not cancel your plan");
    } finally {
      pending.current = false;
      onBusyChange?.(false);
      setBusy(false);
    }
  };
  return step === "confirm" ? (
    <>
      <DialogHeader>
        <DialogTitle>Cancel your subscription?</DialogTitle>
        <DialogDescription>
          You’ll keep full access to your plan features until the end of your
          billing period. After that, your account moves to Free.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={onBack}>
          Go back
        </Button>
        <Button variant="destructive" onClick={() => setStep("reason")}>
          Yes, cancel
        </Button>
      </DialogFooter>
    </>
  ) : (
    <>
      <DialogHeader>
        <DialogTitle>Cancel plan</DialogTitle>
        <DialogDescription>
          Your feedback helps us make Memento better.
        </DialogDescription>
      </DialogHeader>
      <form
        onSubmit={(event) => void submit(event)}
        className="flex flex-col gap-6"
      >
        <FieldGroup>
          <FieldSet disabled={busy}>
            <FieldLegend>Reason for cancellation</FieldLegend>
            <div className="flex flex-col gap-3 rounded-2xl bg-muted p-4">
              {reasons.map(([id, label]) => (
                <label
                  key={id}
                  className="flex cursor-pointer items-center gap-3 text-sm"
                >
                  <input
                    type="radio"
                    name="cancel-reason"
                    value={id}
                    checked={reason === id}
                    onChange={() => setReason(id)}
                    className="size-4 accent-primary"
                  />
                  {label}
                </label>
              ))}
            </div>
          </FieldSet>
          {reason && (
            <Field>
              <FieldLabel htmlFor="cancel-comment">
                Tell us more (optional)
              </FieldLabel>
              <Textarea
                id="cancel-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                maxLength={850}
                disabled={busy}
                placeholder="Tell us more about this"
                className="min-h-24"
              />
            </Field>
          )}
        </FieldGroup>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={busy}
          >
            Go back
          </Button>
          <Button
            type="submit"
            variant="destructive"
            disabled={!reason || busy}
          >
            {busy && <Spinner data-icon="inline-start" />}
            {busy ? "Cancelling…" : "Cancel plan"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
