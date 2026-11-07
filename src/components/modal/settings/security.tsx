import { useRef, useState } from "react";
import dayjs from "dayjs";
import * as yup from "yup";
import { Trash2 } from "lucide-react";
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
import { FormDialog, FormDialogFooter } from "@/components/modal/form-dialog";
import { SettingsSubpage } from "@/pages/dashboard/settings/settings-subpage";
import TwoFactorAuthenticator from "./two-fa";

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
    <>
      <div className="settings-row min-h-9 flex-wrap">
        <span className="text-sm text-text-neutral-strong">Password</span>
        <Button type="button" variant="ghost" className="settings-pill h-9 px-4" onClick={() => setOpen(true)}>
          Change password
        </Button>
      </div>
      {open ? (
        <FormDialog
          title="Change password"
          description="Update the password you use to sign in."
          busy={isMutating}
          onClose={() => setOpen(false)}
        >
          <ChangePasswordForm onBusyChange={setBusy} onSuccess={() => setOpen(false)} onDismiss={() => setOpen(false)} />
        </FormDialog>
      ) : null}
    </>
  );
}

function ChangePasswordForm({ onBusyChange, onSuccess, onDismiss }: { onBusyChange: (busy: boolean) => void; onSuccess: () => void; onDismiss: () => void }) {
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
        inputClassName="!bg-transparent"
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
        inputClassName="!bg-transparent"
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
        inputClassName="!bg-transparent"
      />
      <FormDialogFooter submitLabel="Save password" busyLabel="Saving…" busy={isMutating} onDismiss={onDismiss} />
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
    <section aria-label="Passkeys" className="settings-card flex flex-col gap-9 p-4 sm:p-6">
      <div className="settings-row min-h-9 flex-wrap">
        <div className="flex min-w-0 items-center gap-1.5 text-sm text-text-neutral-strong">
          Passkeys
          {passkeys.length > 0 ? (
            <span className="rounded-full border border-stroke-brand-strong px-2.5 py-0.5 text-xs font-semibold text-text-brand-strong">
              {passkeys.length} added
            </span>
          ) : null}
        </div>
        <Button ref={addButtonRef} type="button" variant="ghost" className="settings-pill h-9 px-4" disabled={adding || Boolean(deletingId)} onClick={handleAddPasskey}>
          Add passkey
          {adding ? <Spinner loading className="!size-4" /> : null}
        </Button>
      </div>
      {error && <Button variant="outline" className="self-start" onClick={retry}>Retry loading passkeys</Button>}
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-text-neutral-weak">
          <Spinner loading className="!size-4" /> Loading passkeys…
        </div>
      ) : passkeys.length === 0 && !error ? (
        <p className="text-sm text-text-neutral-weak">No passkeys registered yet.</p>
      ) : (
        <ul className="flex flex-col gap-9">
          {passkeys.map((pk) => (
            <li key={pk.credential_id} className="settings-row flex-wrap">
              <span className="min-w-0 truncate text-sm text-text-neutral-strong">{pk.device_name}</span>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-base text-text-neutral-weak">
                  Added {dayjs(pk.created_at).format("MMM D, YYYY")}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={(event) => { removalTriggerRef.current = event.currentTarget; removedRef.current = false; setSelectedPasskey(pk); }}
                  disabled={Boolean(deletingId) || adding}
                  className="rounded-full text-text-error-strong hover:text-text-error-strong"
                  aria-label="Remove passkey"
                >
                  {deletingId === pk.credential_id ? (
                    <Spinner loading className="!size-4" />
                  ) : (
                    <Trash2 className="!size-5" strokeWidth={1.75} aria-hidden />
                  )}
                </Button>
              </div>
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
    </section>
  );
}

export default function Security() {
  return (
    <SettingsSubpage title="Security">
      <div className="page-stagger flex w-full flex-col gap-4">
        <section aria-label="Sign-in" className="settings-card flex flex-col gap-9 p-4 sm:p-6">
          <ChangePasswordDialog />
          <TwoFactorAuthenticator />
        </section>
        <PasskeyManager />
      </div>
    </SettingsSubpage>
  );
}
