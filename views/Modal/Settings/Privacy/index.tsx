"use client";

import { useState } from "react";
import { Button } from "@/components/Buttons";
import DeleteAccount from "./DeleteAccount";
import LogoutAccount from "./LogoutAccount";
import { createPortal } from "react-dom";

export default function Privacy() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <div className="w-full flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <span className="font-inter text-base font-bold text-gray-950/90">Privacy & account</span>
        <span className="font-inter text-sm text-gray-950/70">Manage your account privacy settings</span>
      </div>
      <div>
        <span className="font-inter text-sm text-gray-950/70">
          Memento AI believes in transparent data practices. Learn how your information is protected when using our products, and visit our
          <span className="font-semibold text-[#E26A24] underline"> Privacy Policy</span> and <span className="font-semibold text-[#E26A24] underline"> Terms</span> pages for more details.
        </span>
      </div>
      <div className="border border-gray-200 p-4 rounded-2xl flex flex-col gap-4">
        <span className="font-inter text-sm font-medium text-gray-950/90">
          How we protect your information
        </span>
        <span className="font-inter leading-[20px] font-normal text-sm text-gray-950/70">
          Memento AI employs industry-standard security measures to protect your data.
        </span>
        <ul className="list-disc leading-[20px] font-normal ml-4 list-outside font-inter text-sm text-gray-950/70">
          <li>
            Memento AI encrypts your information and shared data before it ever hits our servers. This means that only you have access to your info. The members of our Staff do not.
          </li>
          <li>
            You have control over your conversations and data, and you can change your preferences anytime in your Privacy Settings.
          </li>
          <li>
            Memento AI promptly deleted your data when requested, except for safety violations or feedback you've shared.
          </li>
          <li>Memento AI doesn't sell your data to third parties.</li>
        </ul>
      </div>
      <div className="border border-gray-200 p-4 rounded-2xl flex flex-col gap-4">
        <span className="font-inter text-sm font-medium text-gray-950/90">
          Privacy settings
        </span>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 justify-between">
            <span className="font-inter text-sm text-gray-950/70">Export your information</span>
            <button disabled className="font-semibold text-sm text-gray-400 px-3 py-2 border rounded-full border-[#1018286633] cursor-not-allowed">Coming soon...</button>
          </div>
          <div className="flex items-center gap-2 justify-between">
            <span className="font-inter text-sm text-gray-950/70">
              Shared stories/conversations
            </span>
            <button disabled className="font-semibold text-sm text-gray-400 px-3 py-2 border rounded-full border-[#1018286633] cursor-not-allowed">Coming soon...</button>
          </div>
        </div>
      </div>
      <div className="border border-gray-200 p-4 rounded-2xl flex flex-col gap-4">
        <span className="font-inter text-sm font-medium text-gray-950/90">
          Account Settings
        </span>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 justify-between">
            <span className="font-inter text-sm text-gray-950/70">
              Log out of all devices
            </span>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="font-semibold text-sm text-gray-900 px-3 py-2 border rounded-full border-[#10182866]"
            >
              Log out
            </button>
          </div>
          <div className="flex items-center gap-2 justify-between">
            <span className="font-inter text-sm text-gray-950/70">
              Delete your account
            </span>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="font-semibold text-sm text-white bg-[#F97066] px-3 py-2 rounded-full"
            >
              Delete account
            </button>
          </div>
        </div>
      </div>

      <DeleteAccount
        close={() => setShowDeleteConfirm(false)}
        open={showDeleteConfirm}
      />

      {
        showLogoutConfirm &&
        createPortal(
          <LogoutAccount
            close={() => setShowLogoutConfirm(false)}
            open={showLogoutConfirm}
          />,
          document.body
        )
      }
    </div>
  )
}