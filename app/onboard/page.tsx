"use client";

import Image from "next/image";
import quillInk from "@/public/image/onboarding/quill-ink.png";
import accordion from "@/public/image/onboarding/accordion.png";
import phoneCall from "@/public/image/onboarding/phon-call.png";
import Link from "next/link";

export default function OnboardPage() {
  return (
    <div className="flex flex-col gap-10 p-10">
      <div className="flex flex-col gap-4 animate-fadeIn" style={{ animationDelay: '0ms' }}>
        <h3 className="text-[32px] leading-[38px] font-garamond font-medium">
          Hello, Welcome to Memento
        </h3>
        <span className="text-gray-950/80 text-2xl !leading-[28px] font-garamond font-normal">
          I&apos;m your personal companion for reflection, memory, and legacy. Together, we&apos;ll capture your stories and experience, one thought, one moment at a time.
        </span>
      </div>
      <div className="flex flex-col gap-5 animate-fadeIn" style={{ animationDelay: '200ms' }}>
        <span className="text-orange text-base leading-[24px] font-inter">What can you do on Memento?</span>
        <ul className="flex flex-col gap-5">
          {
            [
              {
                title: "Remember and reflect",
                subtitle: "Save your thoughts, experiences, and lessons in one place. I'll help you reflect on them and keep the memories alive.",
                icon: quillInk
              },
              {
                title: "Converse with your digital twin",
                subtitle: "Talk to your AI twin — shaped by your stories and values. It learns from you, grows with you, and speaks in your voice.",
                icon: phoneCall
              },
              {
                title: "Share your life with the people who matter",
                subtitle: "Invite loved ones to hear your stories, insights, and memories when you choose — privately and securely.",
                icon: accordion
              },
            ].map((item, index) => (
              <li
                key={index}
                className="flex items-center gap-5 animate-slideIn"
                style={{
                  animationDelay: `${400 + index * 200}ms`,
                  animationFillMode: 'both'
                }}
              >
                <div className="w-[84px] p-[7px] shrink-0 h-[84px] flex items-center justify-center">
                  <Image src={item.icon} alt={item.title} className="size-full object-contain" />
                </div>
                <div className="space-y-1 flex-1">
                  <h6 className="text-gray-950/90 text-xl leading-[24px] font-garamond font-bold">{item.title}</h6>
                  <p className="text-gray-950/70 text-xl leading-[28px] font-garamond font-normal">{item.subtitle}</p>
                </div>
              </li>
            ))
          }
        </ul>
      </div>
      <div className="w-full border-t border-black/5" />
      <div>
        <h6 className="text-black/60 text-sm leading-[16px] font-azeret font-medium mb-2">MEMENTO IS PRIVATE BY DESIGN</h6>
        <span className="text-gray-950/40 text-sm leading-[20px] font-azeret font-normal">
          Your entries on Memento are encrypted and only visible to you. You decide what to share, when to share, and with whom.
        </span>
      </div>
      <div>
        <Link
          href="/onboard/nickname"
          prefetch
          className="bg-blue-6 text-white text-sm leading-[20px] cursor-pointer font-semibold rounded-full py-[18px] px-8"
        >
          Continue
        </Link>
      </div>
    </div>

  )
}