// Updated: 2026-02-26
import {
  ArrowUpCircleIcon,
  ChatIcon,
  CompassIcon,
  FolderIcon,
  GearIcon,
  GiftIcon,
  HelpCircleIcon,
  HomeIcon,
  ClockStopwatch,
} from "@/components/icons";

export const settingNavigations = [
  { title: "my profile", link: "/settings/profile" },
  { title: "security", link: "/settings/security" },
  { title: "notifications", link: "/settings/notifications" },
  { title: "beneficiaries", link: "/settings/beneficiaries" },
];

export const topNavigations = [
  { Icon: HomeIcon, title: "Overview", link: "/overview" },
  { Icon: ChatIcon, title: "Chats", link: "/chat" },
  { Icon: FolderIcon, title: "My Memories", link: "/stories" },
  { Icon: CompassIcon, title: "Explore", link: "/explore" },
  { Icon: ClockStopwatch, title: "Time capsule", link: "/capsule" },
  { Icon: GearIcon, title: "Settings", link: "/settings" },
];

export const bottomNavigations = [
  { Icon: GiftIcon, title: "Invite friends", link: "/invite-friends" },
  { Icon: HelpCircleIcon, title: "Feedback & support", link: "/feedback" },
  { Icon: ArrowUpCircleIcon, title: "Upgrade plan", link: "/upgrade", color: "#6BB19E" },
];
