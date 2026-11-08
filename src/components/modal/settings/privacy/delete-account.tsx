import { useId, useRef, useState, type ReactNode } from "react";
import { ChevronRight, Info } from "lucide-react";
import endpoint from "@/api/endpoint";
import useFetcher from "@/hooks/use-fetcher";
import { useLogout } from "@/hooks/use-logout";
import { useStore } from "@/hooks/use-store";
import { reportFetcherError } from "@/api/report-fetcher-error";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import Spinner from "@/components/spinner";
import {
  FormDialogContent,
  FormDialogField,
  FormDialogInput,
  FormDialogTextarea,
} from "@/components/modal/form-dialog";
import { useSubscriptionSummary } from "@/features/pricing/use-subscription-summary";
import {
  buildDeleteAccountPayload,
  DELETE_CONFIRMATION_WORD,
  DELETION_REASONS,
  deletionReasonLabel,
  isDeletionConfirmed,
  maskEmail,
  type DeletionReason,
} from "@/features/account-deletion/deletion";

type Step = "overview" | "reason" | "confirm";

const TITLES: Record<Step, string> = {
  overview: "Delete my account",
  reason: "Choose a reason",
  confirm: "One final step",
};

const fullButton = "h-12 w-full rounded-full text-base font-semibold";

/** Delete my account: what happens and why you're leaving, then type DELETE to confirm (matches mobile). */
export default function DeleteAccount({ close, open }: { close: () => void; open: boolean }) {
  const returnFocusRef = useRef(document.activeElement as HTMLElement | null);
  const { trigger: deleteAccount } = useFetcher(endpoint.deleteAccount, "delete");
  const { logout } = useLogout();
  const { user } = useStore();
  const { summary } = useSubscriptionSummary();
  const isPro = summary?.tier === "pro" || summary?.tier === "legacy";
  const ids = useId();

  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<Step>("overview");
  const [reason, setReason] = useState<DeletionReason | null>(null);
  const [details, setDetails] = useState("");
  // The reason step edits a draft; Continue commits it, closing keeps the old choice.
  const [draftReason, setDraftReason] = useState<DeletionReason | null>(null);
  const [draftDetails, setDraftDetails] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [exportData, setExportData] = useState(false);
  const confirmed = isDeletionConfirmed(confirmation);

  const handleClose = () => {
    if (pending.current) return;
    if (step === "reason") {
      setStep("overview");
      return;
    }
    close();
  };

  const openReasons = () => {
    setDraftReason(reason);
    setDraftDetails(details);
    setStep("reason");
  };

  const saveReason = () => {
    setReason(draftReason);
    setDetails(draftReason === "other" ? draftDetails : "");
    setStep("overview");
  };

  const handleDelete = async () => {
    if (pending.current || !confirmed) return;
    pending.current = true;
    setBusy(true);
    try {
      const result = await deleteAccount(buildDeleteAccountPayload({ reason, details, exportData }));
      if (!result?.success) throw new Error(result?.message || "Couldn’t delete your account. Please retry.");
      // Deletion has already revoked access; don't issue another authenticated logout request.
      await logout({ localOnly: true });
    } catch (error) {
      reportFetcherError(error, "Couldn’t delete your account. Please retry.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  const bullet = (content: ReactNode) => (
    <li className="flex gap-3">
      <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-text-neutral-weaker" />
      <span>{content}</span>
    </li>
  );
  const bold = (text: string) => <strong className="font-semibold text-text-neutral-strong">{text}</strong>;

  return (
    <Dialog open={open} onOpenChange={next => { if (!next) handleClose(); }}>
      <FormDialogContent
        title={TITLES[step]}
        description="Delete your Memento account"
        onClose={handleClose}
        busy={busy}
        onCloseAutoFocus={event => {
          event.preventDefault();
          if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus();
        }}
      >
        {step === "overview" ? (
          <div className="flex flex-col gap-4">
            {isPro ? (
              <div className="flex flex-col gap-2 rounded-[20px] bg-v3-brand-strong/5 p-5">
                <p className="flex items-center gap-2.5 font-semibold text-v3-brand-strong">
                  <Info className="size-5" aria-hidden />
                  Your Pro plan is active
                </p>
                <p className="text-base text-text-neutral-weak">
                  Your Memento Pro plan is still active. You’ll immediately lose access to your Pro plan benefits if you deactivate your account.
                </p>
              </div>
            ) : null}

            <div className="rounded-[20px] border border-stroke-neutral-weak p-5">
              <p className="mb-4 text-lg text-text-neutral-strong">What is going to happen:</p>
              <ul className="flex flex-col gap-4 text-base text-text-neutral-weak">
                {bullet(<>You will be logged out of your account as it enters {bold("deactivation mode")} immediately.</>)}
                {bullet(<>You can {bold("reactivate")} your account if you log in {bold("within")} a {bold("14-day")} cooldown period.</>)}
                {bullet(<>After this period, your data will be {bold("permanently deleted")} from our platform.</>)}
              </ul>
            </div>

            <button
              type="button"
              onClick={openReasons}
              className="flex min-h-[72px] items-center gap-3 rounded-[20px] border border-stroke-neutral-weak px-5 py-3.5 text-left transition-colors hover:bg-fill-neutral-weak focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-neutral-strong"
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm text-text-neutral-weaker">Choose a reason</span>
                <span className="truncate font-semibold text-text-neutral-strong">{deletionReasonLabel(reason)}</span>
              </span>
              <ChevronRight className="size-5 text-icon-neutral-weak" aria-hidden />
            </button>

            <div className="mt-4 flex flex-col gap-3">
              <Button variant="destructive" className={fullButton} onClick={() => setStep("confirm")}>
                Start deletion process
              </Button>
              <Button variant="secondary" className={fullButton} onClick={close}>
                I changed my mind
              </Button>
            </div>
          </div>
        ) : null}

        {step === "reason" ? (
          <div className="flex flex-col gap-6">
            <fieldset className="rounded-[20px] border border-stroke-neutral-weak p-5">
              <legend className="sr-only">Tell us why you’re leaving</legend>
              <p aria-hidden className="mb-3 text-lg text-text-neutral-strong">Tell us why you’re leaving</p>
              <div className="flex flex-col">
                {DELETION_REASONS.map(item => (
                  <label key={item.value} className="flex min-h-11 cursor-pointer items-center gap-3 text-base text-text-neutral-strong">
                    <input
                      type="radio"
                      name={`${ids}-reason`}
                      value={item.value}
                      checked={draftReason === item.value}
                      onChange={() => setDraftReason(item.value)}
                      className="size-5 shrink-0 accent-[color:var(--v3-brand-strong)]"
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </fieldset>
            {draftReason === "other" ? (
              <FormDialogField label="Tell us more" htmlFor={`${ids}-details`}>
                <FormDialogTextarea
                  id={`${ids}-details`}
                  value={draftDetails}
                  maxLength={1000}
                  onChange={event => setDraftDetails(event.target.value)}
                  placeholder="Tell us more about this"
                />
              </FormDialogField>
            ) : null}
            <Button className={fullButton} onClick={saveReason}>
              Continue
            </Button>
          </div>
        ) : null}

        {step === "confirm" ? (
          <form
            className="flex flex-col gap-4"
            onSubmit={event => {
              event.preventDefault();
              void handleDelete();
            }}
          >
            <FormDialogField
              label={`Type “${DELETE_CONFIRMATION_WORD}” to confirm this action`}
              htmlFor={`${ids}-confirm`}
            >
              <FormDialogInput
                id={`${ids}-confirm`}
                value={confirmation}
                onChange={event => setConfirmation(event.target.value)}
                placeholder={DELETE_CONFIRMATION_WORD}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                disabled={busy}
              />
            </FormDialogField>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-base text-text-neutral-strong">
              <Checkbox
                checked={exportData}
                onCheckedChange={value => setExportData(value === true)}
                disabled={busy}
                className="size-5"
              />
              Export my data to my email{user?.email ? ` (${maskEmail(user.email)})` : ""}
            </label>
            <div className="mt-6 flex flex-col gap-3">
              <Button type="submit" variant="destructive" className={fullButton} disabled={!confirmed || busy}>
                {busy ? (
                  <>
                    <Spinner className="!size-4" loading /> Deactivating account
                  </>
                ) : (
                  "Log out and delete account"
                )}
              </Button>
              <Button type="button" variant="secondary" className={fullButton} disabled={busy} onClick={close}>
                I changed my mind
              </Button>
            </div>
          </form>
        ) : null}
      </FormDialogContent>
    </Dialog>
  );
}
