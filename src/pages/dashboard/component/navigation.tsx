import {
  ArchiveIcon,
  ArrowUpCircleIcon,
  CompassIcon,
  GiftIcon,
  HelpCircleIcon,
  HomeIcon,
  SlidersIcon,
  SparklesIcon,
  ClockIcon,
} from "@/components/icons";

export const settingNavigations = [
  { title: "my profile", link: "/settings/profile" },
  { title: "security", link: "/settings/security" },
  { title: "notifications", link: "/settings/notifications" },
  { title: "beneficiaries", link: "/settings/beneficiaries" },
];

export const topNavigations = [
  { Icon: HomeIcon, title: "Overview", link: "/overview" },
  { Icon: SparklesIcon, title: "My conversations", link: "/chat" },
  { Icon: ArchiveIcon, title: "My Memories", link: "/stories" },
  { Icon: CompassIcon, title: "Explore", link: "/explore" },
  { Icon: ClockIcon, title: "Time capsule", link: "/capsule" },
  { Icon: SlidersIcon, title: "Settings", link: "/settings" },
];

export const bottomNavigations = [
  { Icon: GiftIcon, title: "Invite friends", link: "/invite-friends" },
  { Icon: HelpCircleIcon, title: "Feedback & support", link: "/feedback" },
  { Icon: ArrowUpCircleIcon, title: "Upgrade plan", link: "/upgrade", color: "#6BB19E" },
];
