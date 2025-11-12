import {
  AiIcon,
  CompassIcon,
  DollarIcon,
  DoubleHeartIcon,
  HomeIcon,
  QuestionOctagonIcon,
} from "@/components/icons";

export const settingNavigations = [
  { title: "my profile", link: "/settings/profile" },
  { title: "security", link: "/settings/security" },
  { title: "notifications", link: "/settings/notifications" },
  { title: "beneficiaries", link: "/settings/beneficiaries" },
];

export const topNavigations = [
  { Icon: HomeIcon, title: "overview", link: "/overview" },
  { Icon: AiIcon, title: "My conversations", link: "/chat" },
  { Icon: DoubleHeartIcon, title: "my stories", link: "/stories" },
  { Icon: CompassIcon, title: "explore", link: "/explore" },
];

export const bottomNavigations = [
  { Icon: DollarIcon, title: "invite friends", link: "/invite-friends" },
  { Icon: QuestionOctagonIcon, title: "support", link: "/support" },
];
