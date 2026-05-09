// Updated: 2026-02-26
import globeIcon from "@/assets/icon/folder/noto_globe-showing-asia-australia.png";
import chatsIcon from "@/assets/icon/folder/chats icon.png";
import cardFileBoxIcon from "@/assets/icon/folder/noto_card-file-box.png";
import compassIcon from "@/assets/icon/folder/compass.png";
import hourglassIcon from "@/assets/icon/folder/noto_hourglass-not-done.png";
import gearIcon from "@/assets/icon/folder/noto_gear.png";

/** Sub-routes under /settings/:tab (full-page settings). */
export const settingNavigations = [
  { title: "my profile", link: "/settings/general" },
  { title: "security", link: "/settings/security" },
  { title: "beneficiaries", link: "/settings/beneficiary" },
  { title: "privacy", link: "/settings/privacy" },
];

export const topNavigations = [
  { icon: globeIcon, title: "Overview", link: "/overview" },
  { icon: chatsIcon, title: "Chat", link: "/chat" },
  { icon: cardFileBoxIcon, title: "My stories", link: "/stories" },
  { icon: compassIcon, title: "Explore topics", link: "/explore" },
  { icon: hourglassIcon, title: "Time capsules", link: "/capsule" },
];

export const bottomNavigations = [
  { icon: gearIcon, title: "Settings", link: "/settings" },
];
