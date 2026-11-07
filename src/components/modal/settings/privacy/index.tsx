"use client";

import { useState } from "react";
import DeleteAccount from "./delete-account";
import LogoutAccount from "./logout-account";
import { createPortal } from "react-dom";
import { cn } from "@/utility";

export default function Privacy() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const actionRowBase = "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between";
  const actionButtonBase = "w-full sm:w-auto rounded-full px-4 py-2 text-sm font-semibold motion-safe:transition-opacity motion-safe:duration-150";

  return (
    <div className="page-stagger flex w-full flex-col gap-6 sm:gap-8">
      <p className="font-inter text-sm text-v3-text-weak text-pretty">
        Memento AI believes in transparent data practices. Learn how your information is protected when using our products, and visit our
        <span className="font-semibold text-v3-brand-strong underline"> Privacy Policy</span> and
        <span className="font-semibold text-v3-brand-strong underline"> Terms</span> pages for more details.
      </p>

      {/* Protection Info Card */}
      <div className="settings-card flex flex-col gap-4 p-4 sm:p-6">
        <span className="font-inter text-sm font-semibold text-v3-text-strong">
          How we protect your information
        </span>
        <span className="font-inter text-sm font-normal leading-5 text-v3-text-weak">
          Memento AI employs industry-standard security measures to protect your data.
        </span>
        <ul className="ml-4 list-outside list-disc font-inter text-sm font-normal leading-5 text-v3-text-weak">
          <li>
            Memento AI encrypts your information and shared data before it ever hits our servers. This means that only you have access to your
            info. The members of our staff do not.
          </li>
          <li>
            You have control over your conversations and data, and you can change your preferences anytime in your Privacy Settings.
          </li>
          <li>
            Memento AI promptly deletes your data when requested, except for safety violations or feedback you&apos;ve shared.
          </li>
          <li>Memento AI doesn&apos;t sell your data to third parties.</li>
        </ul>
      </div>

      {/* Privacy Settings Card */}
      <div className="settings-card flex flex-col gap-4 p-4 sm:p-6">
        <span className="font-inter text-sm font-semibold text-v3-text-strong">
          Privacy settings
        </span>
        <div className="flex flex-col gap-4">
          <div className={actionRowBase}>
            <span className="font-inter text-sm text-v3-text-weak">Export your information</span>
            <button
              type="button"
              disabled
              className={cn(
                actionButtonBase,
                "cursor-not-allowed border border-v3-stroke-weak text-v3-text-weaker",
              )}
            >
              Coming soon...
            </button>
          </div>
          <div className={actionRowBase}>
            <span className="font-inter text-sm text-v3-text-weak">Shared stories/conversations</span>
            <button
              type="button"
              disabled
              className={cn(
                actionButtonBase,
                "cursor-not-allowed border border-v3-stroke-weak text-v3-text-weaker",
              )}
            >
              Coming soon...
            </button>
          </div>
        </div>
      </div>

      {/* Account Settings Card */}
      <div className="settings-card flex flex-col gap-4 p-4 sm:p-6">
        <span className="font-inter text-sm font-semibold text-v3-text-strong">Account Settings</span>
        <div className="flex flex-col gap-4">
          <div className={actionRowBase}>
            <span className="font-inter text-sm text-v3-text-weak">Log out of all devices</span>
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className={cn(
                actionButtonBase,
                "border border-v3-stroke-weak text-v3-text-strong hover:bg-v3-fill-weak",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-stroke-strong focus-visible:ring-offset-2",
              )}
            >
              Log out
            </button>
          </div>
          <div className={actionRowBase}>
            <span className="font-inter text-sm text-v3-text-weak">Delete your account</span>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className={cn(
                actionButtonBase,
                "bg-[color:var(--fill-error-solid)] text-white hover:opacity-90",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-error-strong focus-visible:ring-offset-2",
              )}
            >
              Delete account
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm &&
        createPortal(
          <DeleteAccount
            close={() => setShowDeleteConfirm(false)}
            open={showDeleteConfirm}
          />,
          document.body,
        )}

      {showLogoutConfirm &&
        createPortal(
          <LogoutAccount
            close={() => setShowLogoutConfirm(false)}
            open={showLogoutConfirm}
          />,
          document.body,
        )}
    </div>
  );
}
