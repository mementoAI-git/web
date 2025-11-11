"use client";

import { useNavigate } from "react-router-dom";
import { ModalCloseBtn } from "./modalLayout";
import { useModal } from "@/hooks/use-modal";
import { storageKeys } from "@/utility/constant";
import welcomeIcon1 from "@/assets/image/welcome/1.png";
import welcomeIcon2 from "@/assets/image/welcome/2.png";
import welcomeIcon3 from "@/assets/image/welcome/3.png";
import welcomeIcon4 from "@/assets/image/welcome/4.png";
import welcomeIcon5 from "@/assets/image/welcome/5.png";

const features = [
  {
    title: "Add Stories",
    subtitle: "Write freely and attach photos, videos, or voice notes to capture your life moments.",
    icon: welcomeIcon1,
    bg: "#E4F4F6",
  },
  {
    title: "Have a conversation with Memento AI",
    subtitle:
      "Converse naturally. Whether you want to reflect, ask questions, or just talk. Your AI listens and learns with you.",
    icon: welcomeIcon2,
    bg: "#F0E3F5",
  },
  {
    title: "Voice Mode",
    subtitle:
      "Prefer speaking to typing? Casually hop on a voice chat with your AI. Every word is saved and transcribed into text.",
    icon: welcomeIcon3,
    bg: "#DAF1EB",
  },
  {
    title: "Streaks",
    subtitle: "Earn streaks for daily, consistent reflection and keep your growth journey alive. ",
    icon: welcomeIcon4,
    bg: "#FFF3BB",
  },
  {
    title: "Beneficiaries",
    subtitle:
      "Choose who can access your stories now and in the future. You’re in control of what’s shared and with whom. ",
    icon: welcomeIcon5,
    bg: "#FFE6CD",
  },
];

export default function Welcome() {
  const { close } = useModal();
  const navigate = useNavigate();

  const handleClose = () => {
    close("welcome");
    localStorage.removeItem(storageKeys.welcomeOnce);
  };

  const handleStartConversation = () => {
    close("welcome");
    navigate("/chat/new");
  };

  return (
    <div className="modal-container relative h-[672px] !max-w-[618px] overflow-y-hidden bg-sand-1">
      <ModalCloseBtn onClick={handleClose} />
      <div className="hide-scrollbar flex-1 !space-y-[20px] overflow-y-auto">
        <div className="flex flex-col gap-1">
          <h4 className="modal-title font-garamond text-[32px] font-medium leading-[38px] text-gray-950/90">
            Welcome to Memento AI v1.0
          </h4>
          <span className="font-garamond text-[24px] font-[400] leading-[32px] text-gray-950/80">
            Your new space to reflect, remember, and preserve what truly matters.
          </span>
        </div>
        <span className="font-inter block text-sm font-bold uppercase text-orange">What’s in this version?</span>

        <ul className="flex flex-col gap-5">
          {features.map((item, index) => (
            <li
              key={item.title}
              className="flex gap-3 animate-slideIn"
              style={{ animationDelay: `${400 + index * 200}ms`, animationFillMode: "both" }}
            >
              <div
                style={{ backgroundColor: item.bg }}
                className="flex size-[40px] shrink-0 items-center justify-center overflow-hidden rounded-full pt-3"
              >
                <img
                  src={item.icon}
                  alt={item.title}
                  className="size-[35px] animate-scale-shake object-contain"
                  style={{ animationDelay: `${index * 0.5}s` }}
                />
              </div>
              <div className="flex-1 space-y-1">
                <h6 className="font-garamond text-[24px] font-medium leading-[32px] text-gray-950/90">
                  {item.title}
                </h6>
                <p className="font-garamond text-[20px] font-normal leading-[28px] text-gray-950/70">
                  {item.subtitle}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <span className="font-inter block text-sm font-bold uppercase text-orange">GIVE US FEEDBACK</span>
        <p className="font-garamond text-[24px] font-[400] leading-[32px] text-gray-950/80">
          Memento is WIP. Please support us by leaving a feedback as we continuously work on making Memento better.
        </p>
        <div className="h-22" />
      </div>
      <div
        className="absolute bottom-0 left-0 right-0 flex w-full items-center justify-center gap-4 border-t border-[#0011661A] bg-sand-1 px-10 pb-10 pt-6"
        style={{ boxShadow: "1px -12px 24px 3px #3535351A" }}
      >
        <button
          type="button"
          onClick={handleStartConversation}
          className="btn flex-1 !px-[32px] !py-[18px] font-inter text-sm font-semibold text-white"
        >
          Start a conversation
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="btn flex-1 !px-[32px] !py-[18px] !bg-black/4 !text-gray-900 font-inter text-sm font-semibold"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
