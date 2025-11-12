"use client";

import { useState } from "react";
import DeleteAccount from "./delete-account";
import LogoutAccount from "./logout-account";
import { createPortal } from "react-dom";

export default function Privacy() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <div className="flex w-full flex-col gap-10">
      <div className="flex flex-col gap-2">
        <span className="font-inter text-base font-bold text-gray-950/90">
          Privacy & account
        </span>
        <span className="font-inter text-sm text-gray-950/70">
          Manage your account privacy settings
        </span>
      </div>
      <div>
        <span className="font-inter text-sm text-gray-950/70">
          Memento AI believes in transparent data practices. Learn how your information is protected when using our products, and visit our
          <span className="font-semibold text-[#E26A24] underline"> Privacy Policy</span> and
          <span className="font-semibold text-[#E26A24] underline"> Terms</span> pages for more details.
        </span>
      </div>
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 p-4">
        <span className="font-inter text-sm font-medium text-gray-950/90">
          How we protect your information
        </span>
        <span className="font-inter text-sm font-normal leading-5 text-gray-950/70">
          Memento AI employs industry-standard security measures to protect your data.
        </span>
        <ul className="ml-4 list-outside list-disc font-inter text-sm font-normal leading-5 text-gray-950/70">
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
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 p-4">
        <span className="font-inter text-sm font-medium text-gray-950/90">
          Privacy settings
        </span>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-inter text-sm text-gray-950/70">Export your information</span>
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-full border border-[#1018286633] px-3 py-2 text-sm font-semibold text-gray-400"
            >
              Coming soon...
            </button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-inter text-sm text-gray-950/70">Shared stories/conversations</span>
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-full border border-[#1018286633] px-3 py-2 text-sm font-semibold text-gray-400"
            >
              Coming soon...
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 p-4">
        <span className="font-inter text-sm font-medium text-gray-950/90">Account Settings</span>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-inter text-sm text-gray-950/70">Log out of all devices</span>
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="rounded-full border border-[#10182866] px-3 py-2 text-sm font-semibold text-gray-900"
            >
              Log out
            </button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-inter text-sm text-gray-950/70">Delete your account</span>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-full bg-[#F97066] px-3 py-2 text-sm font-semibold text-white"
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
