import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  TypographyH1,
  TypographyH2,
  TypographyLead,
  TypographyMuted,
} from "@/components/ui/typography";
import quillInk from "@/assets/image/onboarding/quill-ink.png";
import phoneCall from "@/assets/image/onboarding/phon-call.png";
import accordion from "@/assets/image/onboarding/accordion.png";

const features = [
  {
    title: "Remember and reflect",
    subtitle:
      "Save your thoughts, experiences, and lessons in one place. I'll help you reflect on them and keep the memories alive.",
    icon: quillInk,
  },
  {
    title: "Converse with your digital twin",
    subtitle:
      "Talk to your AI twin — shaped by your stories and values. It learns from you, grows with you, and speaks in your voice.",
    icon: phoneCall,
  },
  {
    title: "Share your life with the people who matter",
    subtitle:
      "Invite loved ones to hear your stories, insights, and memories when you choose — privately and securely.",
    icon: accordion,
  },
];

export default function WelcomePage() {
  return (
    <div className="flex min-h-[calc(100dvh-160px)] flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <TypographyH1 className="font-garamond text-2xl font-normal leading-[32px] text-v3-text-strong sm:text-[28px] sm:leading-[36px] md:text-[28px] md:leading-[32px]">
              Hello, Welcome to Memento
            </TypographyH1>
            <TypographyLead className="font-garamond text-base font-normal leading-[24px] text-v3-text-strong sm:text-xl sm:leading-[26px] md:text-xl md:leading-[26px]">
              I&apos;m your personal interactive companion for self-reflection, memory, and legacy. Together, we&apos;ll
              capture your stories and experience, one thought, one moment at a time.
            </TypographyLead>
          </div>

          <div className="flex flex-col gap-4 sm:gap-5">
            <TypographyMuted className="font-inter text-sm font-normal leading-[20px] text-[var(--rdp-day-selected-background)] sm:leading-[24px]">
              What can you do on Memento?
            </TypographyMuted>
            <ul className="flex flex-col gap-4">
              {features.map((item) => (
                <li
                  key={item.title}
                  className="flex items-start sm:items-center gap-3 sm:gap-4 md:gap-5"
                >
                  <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-lg bg-white/80 shadow-sm overflow-hidden">
                    <img
                      src={item.icon}
                      alt={item.title}
                      className="h-full w-full object-contain p-1"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <TypographyH2 className="font-garamond text-lg font-medium leading-[22px] text-v3-text-strong sm:leading-[24px]">
                      {item.title}
                    </TypographyH2>
                    <TypographyMuted className="font-garamond text-sm font-normal leading-[20px] text-v3-text-weak sm:text-lg sm:leading-[24px] md:text-xl md:leading-[28px]">
                      {item.subtitle}
                    </TypographyMuted>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="w-full border-t border-v3-stroke-weak" />

          <div className="flex flex-col gap-0">
            <TypographyMuted className="mb-2 font-azeret text-xs font-normal leading-[14px] text-v3-text-weak sm:leading-[16px]">
              MEMENTO IS PRIVATE BY DESIGN
            </TypographyMuted>
            <TypographyMuted className="font-azeret text-xs font-normal leading-[18px] text-v3-text-weaker sm:leading-[18px]">
              Your entries on Memento are encrypted and only visible to you. You decide what to share,
              when to share, and with whom.
            </TypographyMuted>
          </div>
        </div>
      </div>

      <div className="shrink-0 bg-white pt-6">
        <Button
          asChild
          className="rounded-full !bg-fill-brand-strong hover:!bg-fill-brand-weak px-6 sm:px-8 py-[23px] text-sm font-semibold leading-[20px] text-white shadow-sm h-[50px]"
        >
          <Link to="/onboard/nickname">Continue</Link>
        </Button>
      </div>
    </div>
  );
}
