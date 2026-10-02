import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import reflectImage from "@/assets/image/onboarding/welcome-reflect-pencil.png";
import twinImage from "@/assets/image/onboarding/welcome-twin-pencil.png";
import shareImage from "@/assets/image/onboarding/welcome-share-pencil.png";

const features = [
  {
    title: "Remember and reflect",
    subtitle:
      "Save your thoughts, experiences, and lessons in one place. I'll help you reflect on them and keep the memories alive.",
    icon: reflectImage,
  },
  {
    title: "Converse with your digital twin",
    subtitle:
      "Talk to your AI twin — shaped by your stories and values. It learns from you, grows with you, and speaks in your voice.",
    icon: twinImage,
  },
  {
    title: "Share your life with the people who matter",
    subtitle:
      "Invite loved ones to hear your stories, insights, and memories when you choose — privately and securely.",
    icon: shareImage,
  },
];

export default function WelcomePage() {
  return (
    <div className="flex min-h-full items-start justify-center py-4 sm:py-6 lg:items-center lg:py-0">
      <div className="w-full max-w-[664px] rounded-[24px] bg-white p-5 sm:p-8 lg:p-10">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <h1 className="font-garamond text-[28px] font-medium leading-[1.1875] text-[rgba(23,11,0,0.9)] sm:text-[32px]">
              Hello, Welcome to Memento
            </h1>
            <p className="font-inter text-base font-normal leading-6 text-[rgba(23,11,0,0.9)]">
              I&apos;m your personal interactive companion for self-reflection, memory, and legacy. Together, we&apos;ll
              capture your stories and experience, one thought, one moment at a time.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <p className="font-inter text-sm font-normal leading-6 text-text-brand-strong">
              What can you do on Memento?
            </p>
            <ul className="flex flex-col gap-3 sm:gap-4">
              {features.map((item) => (
                <li
                  key={item.title}
                  className="flex items-start gap-3 sm:gap-5"
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/80 sm:h-[84px] sm:w-[84px]">
                    <img
                      src={item.icon}
                      alt={item.title}
                      className="h-14 w-14 object-contain sm:h-[70px] sm:w-[70px]"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h2 className="font-inter text-[15px] font-bold leading-6 text-[rgba(23,11,0,0.9)] sm:text-base">
                      {item.title}
                    </h2>
                    <p className="font-inter text-sm font-normal leading-6 text-[rgba(23,11,0,0.72)]">
                      {item.subtitle}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="w-full border-t border-[rgba(23,11,0,0.1)]" />

          <div className="flex flex-col gap-2">
            <p className="font-azeret text-[12px] font-medium leading-4 tracking-[0.08em] text-[rgba(23,11,0,0.9)]">
              MEMENTO IS PRIVATE BY DESIGN
            </p>
            <p className="font-azeret text-[14px] font-normal leading-5 text-[rgba(23,11,0,0.45)]">
              Your entries on Memento are encrypted and only visible to you. You decide what to share,
              when to share, and with whom.
            </p>
          </div>
        </div>

        <div className="pt-6">
          <Button
            asChild
            className="h-14 w-full min-w-[140px] rounded-full border-0 bg-[rgba(23,11,0,0.9)] px-8 text-sm font-semibold leading-5 text-white shadow-none transition-[transform,opacity] duration-150 ease-out hover:opacity-90 active:scale-[0.98] sm:w-auto"
          >
            <Link to="/onboarding/nickname">Continue</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
