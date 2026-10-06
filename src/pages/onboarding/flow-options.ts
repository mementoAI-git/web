import type { EnrichmentCategory } from "@/features/enrichment/enrichment-categories";
import type { MotivationType } from "@/features/onboarding-groot/types";
import { onboardingAssets as assets } from "./assets";

export const reasonOptions: {
  value: string;
  label: string;
  icon: string;
  motivation: MotivationType;
  summary: string;
  inset?: string;
}[] = [
  {
    value: "memory_preservation",
    label: "Preserve memories i don’t want to lose",
    icon: assets["19031-32042/imgEmojionePalmTree"],
    motivation: "memory_preservation",
    summary: "preserve memories I don’t want to lose",
  },
  {
    value: "self_understanding",
    label: "Reflect and understand myself better",
    icon: assets["19031-32042/imgNotoThinkingFace"],
    motivation: "self_understanding",
    summary: "reflect and understand myself better",
  },
  {
    value: "life_record",
    label: "Build a record of my life over time",
    icon: assets["19031-32042/imgNotoOpenBook"],
    motivation: "memory_preservation",
    summary: "build a record of my life over time",
  },
  {
    value: "personal_space",
    label: "Organize my thoughts, stories and files",
    icon: assets["19031-32042/imgGroup1"],
    motivation: "personal_space",
    summary: "organize my thoughts, stories and files",
    inset: "inset-[12.5%_6.25%]",
  },
  {
    value: "emotional_depth",
    label: "Create something meaningful for loved ones",
    icon: assets["19031-32042/imgEmojioneTwoHearts"],
    motivation: "emotional_depth",
    summary: "create something meaningful for loved ones",
  },
  {
    value: "explorer",
    label: "Just exploring",
    icon: assets["19031-32042/imgNotoCrystalBall"],
    motivation: "explorer",
    summary: "explore Memento and discover what feels right for me",
  },
];

export const lifeAreaOptions: {
  value: EnrichmentCategory;
  width: number;
  label: string;
  icon: string;
  inset?: string;
}[] = [
  {
    value: "identity_self",
    width: 147,
    label: "Identity and self",
    icon: assets["19031-32212/imgMingcuteFingerprint2Line"],
  },
  {
    value: "everyday_life",
    width: 128,
    label: "Everyday life",
    icon: assets["19031-32212/imgGroup1"],
    inset: "inset-[8.33%_14.23%]",
  },
  {
    value: "relationships_people",
    width: 183,
    label: "Relationships & People",
    icon: assets["19031-32212/imgMingcuteUserHeartFill"],
  },
  {
    value: "work_purpose",
    width: 144,
    label: "Work & Purpose",
    icon: assets["19031-32212/imgGroup2"],
    inset: "inset-[9.68%_8.67%_12.82%]",
  },
  {
    value: "memories_experiences",
    width: 193,
    label: "Memories & Experiences",
    icon: assets["19031-32212/imgMaterialSymbolsLightPhotoPrints"],
  },
  {
    value: "heritage_roots",
    width: 150,
    label: "Heritage & Roots",
    icon: assets["19031-32212/imgMingcuteHome3Fill"],
  },
  {
    value: "passions_interests",
    width: 168,
    label: "Passions & Interests",
    icon: assets["19031-32212/imgMingcuteGame2Fill"],
  },
  {
    value: "lessons_wisdom",
    width: 167,
    label: "Lessons & Wisdoms",
    icon: assets["19031-32212/imgMingcuteKey2Fill"],
  },
  {
    value: "beliefs_worldview",
    width: 167,
    label: "Beliefs & Worldview",
    icon: assets["19031-32212/imgMingcuteDirectionsFill"],
  },
  {
    value: "hopes_legacy",
    width: 146,
    label: "Hopes & Legacy",
    icon: assets["19031-32212/imgMingcuteLighthouseFill"],
  },
];

export const inspirationOptions = [
  { label: "What you do", prompt: "I spend my time " },
  {
    label: "People important to you",
    prompt: "The people who matter most to me are ",
  },
  { label: "What you care about", prompt: "I care about " },
  { label: "What life is like right now", prompt: "Right now, life feels " },
  { label: "Something you’re working towards", prompt: "I’m working towards " },
];
