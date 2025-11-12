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
    <div className="modal-container h-[672px] overflow-y-hidden relative bg-sand-1 !max-w-[618px] flex flex-col">
      <ModalCloseBtn onClick={handleClose} />
      <div className="overflow-y-auto hide-scrollbar flex-1 !space-y-[20px]">
        <div className="flex flex-col gap-1">
          <h4 className="font-garamond text-[32px] leading-[38px] font-medium text-gray-950/90">
            Welcome to Memento AI v1.0
          </h4>
          <span className="font-garamond text-[24px] leading-[32px] font-[400] text-gray-950/80">
            Your new space to reflect, remember, and preserve what truly matters.
          </span>
        </div>
        <span className="font-inter block text-sm font-bold text-orange uppercase">
          What’s in this version?
        </span>

        <ul className="flex flex-col gap-5">
          {
            features.map((item, index) => (
              <li
                key={index}
                className="flex gap-3 animate-slideIn"
                style={{
                  animationDelay: `${400 + index * 200}ms`,
                  animationFillMode: 'both'
                }}
              >
                <div style={{ backgroundColor: item.bg }} className="size-[40px] pt-3 rounded-full shrink-0 overflow-hidden flex items-center justify-center">
                  <img
                    src={item.icon}
                    alt={item.title}
                    className="size-[35px] object-contain animate-scale-shake"
                    style={{ animationDelay: `${index * 0.5}s` }}
                  />
                </div>
                <div className="space-y-1 flex-1">
                  <h6 className="text-gray-950/90 text-[24px] leading-[32px] font-garamond font-medium">{item.title}</h6>
                  <p className="text-gray-950/70 text-[20px] leading-[28px] font-garamond font-normal">{item.subtitle}</p>
                </div>
              </li>
            ))
          }
        </ul>
        <span className="font-inter block text-sm font-bold text-orange uppercase">
          GIVE US FEEDBACK
        </span>
        <p className="font-garamond text-[24px] leading-[32px] font-[400] text-gray-950/80">
          Memento is WIP. Please support us by leaving a feedback as we continuously work on making Memento better.
        </p>
        <div className="h-22" />
      </div>
      <div className="absolute pt-6 px-10 pb-10 bottom-0 bg-sand-1 left-0 right-0 w-full border-t border-[#0011661A] flex items-center gap-4 justify-center" style={{ boxShadow: '1px -12px 24px 3px #3535351A' }}>
        <button
          onClick={handleStartConversation}
          className="btn flex-1 !py-[18px] !px-[32px] text-sm font-semibold font-inter text-white"
        >
          Start a conversation
        </button>
        <button onClick={handleClose} className="btn flex-1 !py-[18px] !px-[32px] text-sm font-semibold font-inter !bg-black/4 !text-gray-900">
          Not now
        </button>
      </div>
    </div>
  );
}
