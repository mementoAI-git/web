// Updated: 2026-02-26
import globeIcon from "@/assets/icon/folder/noto_globe-showing-asia-australia.png";
import chatsIcon from "@/assets/icon/folder/chats icon.png";
import cardFileBoxIcon from "@/assets/icon/folder/noto_card-file-box.png";
import compassIcon from "@/assets/icon/folder/compass.png";
import hourglassIcon from "@/assets/icon/folder/noto_hourglass-not-done.png";
import gearIcon from "@/assets/icon/folder/noto_gear.png";
import upgradeIcon from "@/assets/icon/folder/noto_upwards-button.png";
import inviteIcon from "@/assets/icon/folder/noto_couple-with-heart-woman-man-light-skin-tone-medium-light-skin-tone.png";

export const settingNavigations = [
  { title: "my profile", link: "/settings/profile" },
  { title: "security", link: "/settings/security" },
  { title: "notifications", link: "/settings/notifications" },
  { title: "beneficiaries", link: "/settings/beneficiaries" },
];

export const topNavigations = [
  { icon: globeIcon, title: "Overview", link: "/overview" },
  { icon: chatsIcon, title: "Chats", link: "/chat" },
  { icon: cardFileBoxIcon, title: "My Memories", link: "/stories" },
  { icon: compassIcon, title: "Explore", link: "/explore" },
  { icon: hourglassIcon, title: "Time capsule", link: "/capsule" },
];

export const bottomNavigations = [
  { icon: gearIcon, title: "Settings", link: "/settings" },
  { icon: inviteIcon, title: "Invite friends", link: "/invite-friends" },
  { icon: upgradeIcon, title: "Upgrade plan", link: "/upgrade" },
];
