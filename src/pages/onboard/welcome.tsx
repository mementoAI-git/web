import { Link } from "react-router-dom";
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
    <div className="flex flex-col gap-6 sm:gap-8 md:gap-10 p-4 sm:p-6 md:p-10">
      <div className="flex flex-col gap-3 sm:gap-4 animate-fadeIn" style={{ animationDelay: "0ms" }}>
        <h3 className="font-garamond text-2xl sm:text-[28px] md:text-[32px] font-medium leading-[32px] sm:leading-[36px] md:leading-[38px]">
          Hello, Welcome to Memento
        </h3>
        <span className="font-garamond text-base sm:text-xl md:text-2xl font-normal leading-[24px] sm:leading-[26px] md:leading-[28px] text-gray-950/80">
          I&apos;m your personal companion for reflection, memory, and legacy. Together, we&apos;ll
          capture your stories and experience, one thought, one moment at a time.
        </span>
      </div>

      <div className="flex flex-col gap-4 sm:gap-5 animate-fadeIn" style={{ animationDelay: "200ms" }}>
        <span className="font-inter text-sm sm:text-base leading-[20px] sm:leading-[24px] text-orange">
          What can you do on Memento?
        </span>
        <ul className="flex flex-col gap-4 sm:gap-5">
          {features.map((item, index) => (
            <li
              key={item.title}
              className="flex items-start sm:items-center gap-3 sm:gap-4 md:gap-5 animate-slideIn"
              style={{
                animationDelay: `${400 + index * 200}ms`,
                animationFillMode: "both",
              }}
            >
              <div className="flex h-[60px] w-[60px] sm:h-[70px] sm:w-[70px] md:h-[84px] md:w-[84px] shrink-0 items-center justify-center p-[5px] sm:p-[6px] md:p-[7px]">
                <img src={item.icon} alt={item.title} className="size-full object-contain" />
              </div>
              <div className="flex-1 space-y-1">
                <h6 className="font-garamond text-lg sm:text-xl font-bold leading-[22px] sm:leading-[24px] text-gray-950/90">
                  {item.title}
                </h6>
                <p className="font-garamond text-sm sm:text-lg md:text-xl font-normal leading-[20px] sm:leading-[24px] md:leading-[28px] text-gray-950/70">
                  {item.subtitle}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="w-full border-t border-black/5" />

      <div>
        <h6 className="mb-2 font-azeret text-xs sm:text-sm font-medium leading-[14px] sm:leading-[16px] text-black/60">
          MEMENTO IS PRIVATE BY DESIGN
        </h6>
        <span className="font-azeret text-xs sm:text-sm font-normal leading-[18px] sm:leading-[20px] text-gray-950/40">
          Your entries on Memento are encrypted and only visible to you. You decide what to share,
          when to share, and with whom.
        </span>
      </div>

      <div>
        <Link
          to="/onboard/nickname"
          className="inline-block rounded-full bg-blue-6 px-6 sm:px-8 py-4 sm:py-[18px] text-sm font-semibold leading-[20px] text-white transition-colors duration-200 hover:bg-blue-7 active:bg-blue-8"
        >
          Continue
        </Link>
      </div>
    </div>
  );
}
