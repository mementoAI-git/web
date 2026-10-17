import { useRef, useState } from "react";
import * as yup from "yup";
import { Fingerprint, Trash2 } from "lucide-react";
import { startRegistration } from "@simplewebauthn/browser";
import { getMementoClientHeaders } from "@/api/client-metadata";
import { authService } from "@/utility/auth-service";
import { Passwordinput } from "@/components/Form";
import useFetcher from "@/hooks/use-fetcher";
import useForm from "@/hooks/use-form";
import endpoint from "@/api/endpoint";
import { toast } from "sonner";
import Spinner from "@/components/spinner";
import useSWR from "swr";
import { useRequestRecovery } from "@/hooks/use-request-recovery";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { deleteFetcher, fetcher } from "@/api/fetcher";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import TwoFactorAuthenticator from "./two-fa";
import { SettingsSectionCard } from "./settings-section-card";
import { SettingsPillButton } from "./settings-action-row";

const initial = {
  new_password: "",
  old_password: "",
  c_password: "",
};

const schema = yup.object().shape({
  old_password: yup.string().required("Old Password is required"),
  new_password: yup
    .string()
    .required("New Password is required")
    .min(6, "Password must be at least 6 characters long")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[0-9]/, "Password must contain at least one number")
    .matches(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character"),
  c_password: yup
    .string()
    .oneOf([yup.ref("new_password"), null], "Passwords must match")
    .required("Confirm Password is required"),
});

const inputLabelClass = "!text-v3-text-weak !font-normal";

function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const [isMutating, setBusy] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(next) => {
      if (isMutating) return;
      setOpen(next);
    }}>
      <SettingsSectionCard
        title="Password"
        description="Update the password you use to sign in to Memento."
        className="sm:min-h-[97px]"
        headerAction={<DialogTrigger asChild><SettingsPillButton variant="default">Change password</SettingsPillButton></DialogTrigger>}
      />
      <DialogContent
        data-sky-card-page=""
        showCloseButton={!isMutating}
        className="sky-card max-h-[calc(100dvh-2rem)] overflow-y-auto border border-v3-stroke-weak sm:max-w-md motion-reduce:animate-none"
        overlayClassName="bg-overlay-backdrop motion-reduce:animate-none"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          document.getElementById("change-old-password")?.focus();
        }}
        onEscapeKeyDown={(event) => { if (isMutating) event.preventDefault(); }}
        onInteractOutside={(event) => { if (isMutating) event.preventDefault(); }}
      >
        <DialogHeader className="pr-8">
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>Update the password you use to sign in.</DialogDescription>
        </DialogHeader>
        <ChangePasswordForm onBusyChange={setBusy} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function ChangePasswordForm({ onBusyChange, onSuccess }: { onBusyChange: (busy: boolean) => void; onSuccess: () => void }) {
  const { trigger, isMutating } = useFetcher(endpoint.changePassword);
  const { values, handleChange, handleSubmit, errors } = useForm({
    initial,
    schema,
    async onSubmit(payload) {
      if (isMutating) return;
      onBusyChange(true);
      try {
        const result = await trigger(payload);
        if (result.success) {
          toast.success(result?.message);
          onSuccess();
        }
      } finally {
        onBusyChange(false);
      }
    },
  });

  return (
    <form onSubmit={handleSubmit} aria-busy={isMutating} className="flex flex-col gap-5">
      <Passwordinput
        id="change-old-password"
        disabled={isMutating}
        label="Old password"
        name="old_password"
        value={values.old_password}
        error={errors.old_password}
        onChange={handleChange}
        labelClassName={inputLabelClass}
      />
      <Passwordinput
        disabled={isMutating}
        autoComplete="new-password"
        label="New password"
        name="new_password"
        value={values.new_password}
        error={errors.new_password}
        onChange={handleChange}
        labelClassName={inputLabelClass}
      />
      <Passwordinput
        disabled={isMutating}
        autoComplete="new-password"
        label="Confirm password"
        name="c_password"
        value={values.c_password}
        error={errors.c_password}
        onChange={handleChange}
        labelClassName={inputLabelClass}
      />
      <div className="flex justify-end border-t border-v3-stroke-weak pt-4">
        <SettingsPillButton type="submit" variant="default" aria-label="Save password" aria-busy={isMutating} disabled={isMutating}>
          <span>Save password</span>
          {isMutating ? <Spinner loading className="!size-4 text-v3-text-strong" /> : null}
        </SettingsPillButton>
      </div>
    </form>
  );
}

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

interface PasskeyEntry {
  credential_id: string;
  device_name: string;
  created_at: string;
}

function PasskeyManager() {
  const { data, isLoading, error, mutate: refreshPasskeys } = useSWR<{ data: PasskeyEntry[] }>(endpoint.listPasskeys, fetcher, { shouldRetryOnError: false });
  const retry = useRequestRecovery("passkeys", error, refreshPasskeys, "Passkeys couldn’t be loaded. Try again.");
  const [selectedPasskey, setSelectedPasskey] = useState<PasskeyEntry | null>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const removalTriggerRef = useRef<HTMLButtonElement | null>(null);
  const removedRef = useRef(false);
  const removalPendingRef = useRef(false);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const passkeys = data?.data ?? [];

  async function handleAddPasskey() {
    if (adding || deletingId) return;
    setAdding(true);
    try {
      // 1. Get registration options
      const token = authService.getAuthData()?.access_token;

      const beginRes = await fetch(`${API_BASE}${endpoint.passkeyRegisterBegin}`, {
        method: "POST",
        headers: {
          ...getMementoClientHeaders(),
          Authorization: `Bearer ${token}`,
        },
      });
      const beginData = await beginRes.json();
      if (!beginRes.ok) {
        toast.error(beginData?.message ?? "Could not start passkey setup");
        return;
      }

      // 2. Browser prompts for biometric/device registration
      const regResponse = await startRegistration({ optionsJSON: beginData.data });

      // 3. Complete registration on server
      const deviceName = navigator.userAgentData?.platform || navigator.platform || "Unknown device";
      const completeRes = await fetch(`${API_BASE}${endpoint.passkeyRegisterComplete}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getMementoClientHeaders(),
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ response: regResponse, device_name: deviceName }),
      });
      const completeData = await completeRes.json();
      if (!completeRes.ok) {
        toast.error(completeData?.message ?? "Passkey registration failed");
        return;
      }

      toast.success("Passkey added successfully");
      void refreshPasskeys().catch(() => undefined);
    } catch (err) {
      if (err instanceof Error && err.name === "NotAllowedError") return; // user cancelled
      toast.error("Could not add passkey. Try again.");
    } finally {
      setAdding(false);
    }
  }

  async function handleDeletePasskey(credentialId: string) {
    if (removalPendingRef.current) return;
    removalPendingRef.current = true;
    setDeletingId(credentialId);
    try {
      const url = endpoint.deletePasskey.replace(":credential_id", encodeURIComponent(credentialId));
      const result = await deleteFetcher(url, { arg: {} });
      if (result?.success) {
        toast.success(result?.message ?? "Passkey removed");
        await refreshPasskeys(current => ({ data: (current?.data ?? []).filter(key => key.credential_id !== credentialId) }), { revalidate: false });
        removedRef.current = true;
        setSelectedPasskey(null);
      }
    } catch {
      // The shared mutation fetcher reports the error; keep confirmation open for retry.
    } finally {
      removalPendingRef.current = false;
      setDeletingId(null);
    }
  }

  return (
    <SettingsSectionCard
      title="Passkeys"
      description="Sign in with your fingerprint, face, or device PIN."
      className="[&>div:first-child]:gap-0"
      headerAction={
<SettingsPillButton ref={addButtonRef} type="button" variant="default" className="sm:-translate-y-1.5" disabled={adding || Boolean(deletingId)} onClick={handleAddPasskey}>
          <Fingerprint size={14} strokeWidth={1.5} />
          <span>Add a passkey</span>
          {adding ? <Spinner loading className="!size-4 text-v3-text-strong" /> : null}
        </SettingsPillButton>
      }
    >
      {error && <Button variant="outline" onClick={retry}>Retry loading passkeys</Button>}
      {isLoading ? (
        <div className="flex items-center gap-2 font-inter text-sm text-v3-text-weak">
          <Spinner loading className="!size-4" /> Loading passkeys…
        </div>
      ) : passkeys.length === 0 && !error ? (
        <p className="font-inter text-sm text-v3-text-weak">No passkeys registered yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {passkeys.map((pk) => (
            <li
              key={pk.credential_id}
              className="sky-card flex items-center justify-between gap-3 rounded-xl border border-v3-stroke-weak px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Fingerprint size={16} className="shrink-0 text-v3-text-weak" strokeWidth={1.5} />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-inter text-sm font-medium text-v3-text-strong">{pk.device_name}</span>
                  <span className="font-inter text-xs text-v3-text-weak">
                    Added {new Date(pk.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={(event) => { removalTriggerRef.current = event.currentTarget; removedRef.current = false; setSelectedPasskey(pk); }}
                disabled={Boolean(deletingId) || adding}
                className="flex shrink-0 items-center justify-center rounded-full p-2 text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
                aria-label="Remove passkey"
              >
                {deletingId === pk.credential_id ? (
                  <Spinner loading className="!size-4 text-danger" />
                ) : (
                  <Trash2 size={14} strokeWidth={1.5} />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      <AlertDialog open={Boolean(selectedPasskey)} onOpenChange={next => { if (!next && !removalPendingRef.current) setSelectedPasskey(null); }}>
        <AlertDialogContent className="motion-reduce:animate-none" onEscapeKeyDown={event => { if (removalPendingRef.current) event.preventDefault(); }} onCloseAutoFocus={event => {
          event.preventDefault();
          const target = removedRef.current ? addButtonRef.current : removalTriggerRef.current;
          if (target?.isConnected) target.focus(); else addButtonRef.current?.focus();
        }}>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove passkey?</AlertDialogTitle>
            <AlertDialogDescription>
              You won’t be able to sign in with the passkey for {selectedPasskey?.device_name || "this device"}. Make sure you can sign in with your password or another passkey.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingId)}>Cancel</AlertDialogCancel>
            <Button variant="destructive" aria-busy={Boolean(deletingId)} disabled={Boolean(deletingId)} onClick={() => { if (selectedPasskey) void handleDeletePasskey(selectedPasskey.credential_id); }}>
              {deletingId ? "Removing…" : "Remove passkey"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>



    </SettingsSectionCard>
  );
}

export default function Security() {

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex min-w-0 flex-col gap-1">
        <span className="font-inter text-base font-bold text-v3-text-strong text-balance">Security</span>
        <span className="font-inter text-sm text-v3-text-weak text-pretty">Manage your Memento account security</span>
      </header>

      <ChangePasswordDialog />

      <PasskeyManager />

      <TwoFactorAuthenticator />

    </div>
  );
}
