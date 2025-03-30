import HomeIcon from "@/public/icon/dashboard/home.svg"
import DocsIcon from "@/public/icon/dashboard/doc.svg"
import QuestionIcon from "@/public/icon/dashboard/question-octagon.svg"
import DollarIcon from "@/public/icon/dashboard/dollar.svg"
import SlideIcon from "@/public/icon/dashboard/slide.svg"
import CompassIcon from "@/public/icon/dashboard/compass.svg"
import TimeIcon from "@/public/icon/dashboard/time.svg"

export const topNavigations = [
  { Icon: HomeIcon, title: "overview", link: "dashboard" },
  { Icon: CompassIcon, title: "explore", link: "explore" },
  { Icon: DocsIcon, title: "my memories", link: "memories" },
  { Icon: TimeIcon, title: "time capsule", link: "time-capsule" }
]

export const bottomNavigations = [
  { Icon: DollarIcon, title: "invite friends", link: "invite-friends" },
  { Icon: QuestionIcon, title: "support", link: "support" },
  { Icon: SlideIcon, title: "settings", link: "settings" }
]
