// Updated: 2026-02-26
import globeIcon from "@/assets/icon/sidebar/globe.svg";
import cardFileBoxIcon from "@/assets/icon/sidebar/card-file-box.svg";
import gearIcon from "@/assets/icon/sidebar/gear.svg";

/** Sub-routes under /settings/:tab (full-page settings). */
export const settingNavigations = [
  { title: "my profile", link: "/settings/general" },
  { title: "security", link: "/settings/security" },
  { title: "beneficiaries", link: "/settings/beneficiary" },
  { title: "privacy", link: "/settings/privacy" },
];

export const topNavigations = [
  { icon: globeIcon, title: "Overview", link: "/overview" },
  { emoji: "💬", title: "Chat", link: "/chat" },
  { icon: cardFileBoxIcon, title: "My Stories", link: "/stories" },
  { emoji: "🧭", title: "Topics", link: "/explore" },
];

export const bottomNavigations = [
  { icon: gearIcon, title: "Settings", link: "/settings", deepenOnSky: true },
];
