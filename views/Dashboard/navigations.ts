import HomeIcon from "@/public/icon/dashboard/home.svg";
import ChatIcon from "@/public/icon/chat.svg";
import DoubleHeartIcon from "@/public/icon/double-heart.svg";
import QuestionIcon from "@/public/icon/dashboard/question-octagon.svg";
import DollarIcon from "@/public/icon/dashboard/dollar.svg";
import CompassIcon from "@/public/icon/dashboard/compass.svg";
import AIIcon from "@/public/icon/ai.svg"

export const settingNavigations = [
  { title: "my profile", link: "/settings/profile" },
  { title: "security", link: "/settings/security" },
  { title: "notifications", link: "/settings/notifications" },
  { title: "beneficiaries", link: "/settings/beneficiaries" },
  // { title: "upgrade and plans", link: "/settings/plan" },
]

export const topNavigations = [
  { Icon: HomeIcon, title: "overview", link: "/overview" },
  { Icon: AIIcon, title: "My conversations", link: "/chat" },
  { Icon: DoubleHeartIcon, title: "my stories", link: "/memories" },
  { Icon: CompassIcon, title: "explore", link: "/explore" },
  // { Icon: TimeIcon, title: "time capsule", link: "/time-capsule" }
];

export const bottomNavigations = [
  { Icon: DollarIcon, title: "invite friends", link: "/invite-friends" },
  { Icon: QuestionIcon, title: "support", link: "/support" }
];
