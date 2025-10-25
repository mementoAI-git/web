"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useLogout } from "@/hooks/use-logout";
import { Button } from "@/components/Buttons";
import DeleteAccount from "./DeleteAccount";

export default function Privacy() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { logout, loading: logoutLoading } = useLogout();

  const handleLogoutAllDevices = async () => {
    try {
      await logout();
      toast.success("Logged out of all devices");
    } catch (error: any) {
      toast.error("Failed to logout");
    }
  };

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
            <button className="font-semibold text-sm text-gray-900 px-3 py-2 border rounded-full border-[#10182866]">Export</button>
          </div>
          <div className="flex items-center gap-2 justify-between">
            <span className="font-inter text-sm text-gray-950/70">
              Shared stories/conversations
            </span>
            <button className="font-semibold text-sm text-gray-900 px-3 py-2 border rounded-full border-[#10182866]">Manage</button>
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

      {/* Logout All Devices Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="font-inter text-lg font-bold text-gray-950 mb-2">Logout All Devices</h3>
            <p className="font-inter text-sm text-gray-950/70 mb-6">
              This will log you out of all devices and sessions. You'll need to log in again on all your devices.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowLogoutConfirm(false)}
                title="Cancel"
                className="flex-1 font-semibold text-sm text-gray-900 px-3 py-2 border rounded-full border-[#10182866] bg-transparent hover:bg-gray-50"
              />
              <Button
                onClick={handleLogoutAllDevices}
                loading={logoutLoading}
                title="Logout All Devices"
                className="flex-1 font-semibold text-sm text-gray-900 px-3 py-2 border rounded-full border-[#10182866] bg-transparent hover:bg-gray-50"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}