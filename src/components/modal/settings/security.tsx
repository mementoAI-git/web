import { useState } from "react";
import { createPortal } from "react-dom";
import * as yup from "yup";
import { X, Fingerprint, Trash2 } from "lucide-react";
import { startRegistration } from "@simplewebauthn/browser";
import { Passwordinput } from "@/components/Form";
import useFetcher from "@/hooks/use-fetcher";
import useForm from "@/hooks/use-form";
import endpoint from "@/api/endpoint";
import { toast } from "sonner";
import Spinner from "@/components/spinner";
import useSWR, { mutate } from "swr";
import { fetcher } from "@/api/fetcher";
import { cn } from "@/utility";
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
    .matches(/[!@#$%^&*(),.?\":{}|<>]/, "Password must contain at least one special character"),
  c_password: yup
    .string()
    .oneOf([yup.ref("new_password"), null], "Passwords must match")
    .required("Confirm Password is required"),
});

const inputLabelClass = "!text-v3-text-weak !font-normal";

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { trigger, isMutating } = useFetcher(endpoint.changePassword);
  const { values, handleChange, handleSubmit, errors } = useForm({
    initial,
    schema,
    async onSubmit(payload) {
      const result = await trigger(payload);
      if (result.success) {
        toast.success(result?.message);
        onClose();
      }
    },
  });

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={cn(
          "relative w-full max-w-md rounded-2xl border border-v3-stroke-weak bg-white p-6 shadow-xl",
          "motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200",
        )}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-inter text-sm font-semibold text-v3-text-strong">Change password</h2>
            <p className="font-inter text-sm text-v3-text-weak">Update the password you use to sign in.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full",
              "text-v3-text-weak hover:bg-v3-fill-weak hover:text-v3-text-strong",
              "motion-safe:transition-colors motion-safe:duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-stroke-strong focus-visible:ring-offset-2",
            )}
            aria-label="Close"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Passwordinput
            label="Old password"
            name="old_password"
            value={values.old_password}
            error={errors.old_password}
            onChange={handleChange}
            labelClassName={inputLabelClass}
          />
          <Passwordinput
            label="New password"
            name="new_password"
            value={values.new_password}
            error={errors.new_password}
            onChange={handleChange}
            labelClassName={inputLabelClass}
          />
          <Passwordinput
            label="Confirm password"
            name="c_password"
            value={values.c_password}
            error={errors.c_password}
            onChange={handleChange}
            labelClassName={inputLabelClass}
          />
          <div className="flex justify-end border-t border-v3-stroke-weak pt-4">
            <SettingsPillButton type="submit" variant="default" disabled={isMutating}>
              <span>Save password</span>
              {isMutating ? <Spinner loading className="!size-4 text-v3-text-strong" /> : null}
            </SettingsPillButton>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

interface PasskeyEntry {
  credential_id: string;
  device_name: string;
  created_at: string;
}

function PasskeyManager() {
  const { data, isLoading } = useSWR<{ data: PasskeyEntry[] }>(endpoint.listPasskeys, fetcher);
  const { trigger: deletePasskey } = useFetcher("", "delete");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const passkeys = data?.data ?? [];

  async function handleAddPasskey() {
    setAdding(true);
    try {
      // 1. Get registration options
      const auth = JSON.parse(localStorage.getItem("memento:auth") ?? "{}");
      const token = auth?.access_token;

      const beginRes = await fetch(`${API_BASE}${endpoint.passkeyRegisterBegin}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ response: regResponse, device_name: deviceName }),
      });
      const completeData = await completeRes.json();
      if (!completeRes.ok) {
        toast.error(completeData?.message ?? "Passkey registration failed");
        return;
      }

      toast.success("Passkey added successfully");
      mutate(endpoint.listPasskeys);
    } catch (err: any) {
      if (err?.name === "NotAllowedError") return; // user cancelled
      toast.error("Could not add passkey. Try again.");
    } finally {
      setAdding(false);
    }
  }

  async function handleDeletePasskey(credentialId: string) {
    setDeletingId(credentialId);
    try {
      const url = endpoint.deletePasskey.replace(":credential_id", encodeURIComponent(credentialId));
      const result = await deletePasskey({}, url);
      if (result?.success) {
        toast.success(result?.message ?? "Passkey removed");
        mutate(endpoint.listPasskeys);
      }
    } catch {
      toast.error("Could not remove passkey");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {isLoading ? (
        <div className="flex items-center gap-2 font-inter text-sm text-v3-text-weak">
          <Spinner loading className="!size-4" /> Loading passkeys…
        </div>
      ) : passkeys.length === 0 ? (
        <p className="font-inter text-sm text-v3-text-weak">No passkeys registered yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {passkeys.map((pk) => (
            <li
              key={pk.credential_id}
              className="flex items-center justify-between gap-3 rounded-xl border border-v3-stroke-weak px-4 py-3"
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
                onClick={() => handleDeletePasskey(pk.credential_id)}
                disabled={deletingId === pk.credential_id}
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

      <div className="flex justify-end">
        <SettingsPillButton type="button" variant="default" disabled={adding} onClick={handleAddPasskey}>
          <Fingerprint size={14} strokeWidth={1.5} />
          <span>Add a passkey</span>
          {adding ? <Spinner loading className="!size-4 text-v3-text-strong" /> : null}
        </SettingsPillButton>
      </div>
    </div>
  );
}

export default function Security() {
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex min-w-0 flex-col gap-1">
        <span className="font-inter text-base font-bold text-v3-text-strong text-balance">Security</span>
        <span className="font-inter text-sm text-v3-text-weak text-pretty">Manage your Memento account security</span>
      </header>

      <SettingsSectionCard
        title="Password"
        description="Update the password you use to sign in to Memento."
      >
        <div className="flex justify-end">
          <SettingsPillButton variant="default" onClick={() => setPasswordModalOpen(true)}>
            Change password
          </SettingsPillButton>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Passkeys"
        description="Sign in with your device biometrics — fingerprint, Face ID, or Windows Hello — without needing a password."
      >
        <PasskeyManager />
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Two-factor authentication"
        description="An authenticator app adds a verification step each time you sign in."
      >
        <TwoFactorAuthenticator />
      </SettingsSectionCard>

      {passwordModalOpen && <ChangePasswordModal onClose={() => setPasswordModalOpen(false)} />}
    </div>
  );
}
