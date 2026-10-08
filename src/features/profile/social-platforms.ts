import Bluesky from "@/assets/icon/social-profiles/bluesky_social.svg?react";
import X from "@/assets/icon/social-profiles/social_x.svg?react";
import Youtube from "@/assets/icon/social-profiles/youtube.svg?react";
import Linkedin from "@/assets/icon/social-profiles/linkedin.svg?react";
import Facebook from "@/assets/icon/social-profiles/facebook.svg?react";
export const socialPlatforms = [
  {
    key: "bluesky",
    label: "Bluesky",
    Icon: Bluesky,
    placeholder: "https://bsky.app/profile/you.bsky.social",
  },
  { key: "x", label: "X", Icon: X, placeholder: "https://x.com/you" },
  {
    key: "youtube",
    label: "YouTube",
    Icon: Youtube,
    placeholder: "https://www.youtube.com/@you",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    Icon: Linkedin,
    placeholder: "https://www.linkedin.com/in/you",
  },
  {
    key: "facebook",
    label: "Facebook",
    Icon: Facebook,
    placeholder: "https://www.facebook.com/you",
  },
] as const;
