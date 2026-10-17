import { Link } from "react-router-dom";
import { useSkipOnboarding } from "./use-skip-onboarding";
import { onboardingAssets as assets } from "./assets";
import {
  OnboardingActions,
  OnboardingButton,
  OnboardingCard,
  OnboardingTitle,
} from "./components/onboarding-card";

const features = [
  {
    title: "Remember and reflect",
    description:
      "Save your thoughts, experiences, and lessons in one place. Memento helps you reflect on them and keep the memories alive.",
    image: assets["19031-31954/imgImage6344715"],
    imageClass:
      "absolute left-[-18.98%] top-[-18.99%] h-[137.99%] w-[137.99%] max-w-none",
    textClass: "",
  },
  {
    title: "Converse with your digital twin",
    description:
      "Talk to your AI twin, shaped by your stories and values. It learns from you, grows with you, and speaks in your voice.",
    image: assets["19031-31954/imgImage6344716"],
    imageClass:
      "absolute left-[-19.27%] top-[-17.5%] h-[136.89%] w-[136.89%] max-w-none",
    textClass: "sm:max-w-[295px]",
  },
  {
    title: "Share your stories with loved ones",
    description:
      "Invite friends and family to read/hear the stories and memories you’ve created, when you choose — privately and securely.",
    image: assets["19031-31954/imgImage6344717"],
    imageClass: "size-10 object-cover",
    textClass: "sm:max-w-[296px]",
  },
];

export default function WelcomePage() {
  const { skip, busy } = useSkipOnboarding();
  return (
    <OnboardingCard>
      <div className="flex flex-col gap-3">
        <img
          src={assets["19031-31954/imgIconMOrange"]}
          alt=""
          className="self-start"
        />
        <OnboardingTitle className="sm:max-w-[325px]">
          Hey there, <em className="text-text-brand-strong">welcome</em> to
          Memento AI
        </OnboardingTitle>
        <p className="text-sm leading-5">
          I’m your personal interactive companion for self-reflection, memory
          and legacy. Together, we’ll capture your stories and experiences, one
          thought, one moment at a time.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-sm leading-[21px] text-text-brand-strong">
          What can you do on Memento?
        </p>
        <ul className="flex flex-col gap-3">
          {features.map((feature) => (
            <li key={feature.title} className="flex items-start gap-3">
              <div className="relative size-10 shrink-0 overflow-hidden rounded-[6px]">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className={feature.imageClass}
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1 text-sm leading-5">
                <h2 className="font-bold">{feature.title}</h2>
                <p className={"text-text-neutral-weak " + feature.textClass}>
                  {feature.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <aside className="flex flex-col gap-2 rounded-2xl border border-stroke-success-weak bg-fill-success-weak px-[15px] py-[11px] font-azeret">
        <p className="text-xs font-medium leading-4 text-text-success-strong">
          MEMENTO IS PRIVATE BY DESIGN
        </p>
        <p className="text-sm leading-5">
          Your entries on Memento AI are encrypted and only visible to you. You
          decide what to share, when to share, and with whom.
        </p>
      </aside>
      <OnboardingActions>
        <OnboardingButton
          variant="outline"
          className="min-w-[91px]"
          onClick={() => void skip()}
          disabled={busy}
        >
          Skip
        </OnboardingButton>
        <OnboardingButton asChild disabled={busy}>
          <Link to="/onboarding/nickname" onClick={(event) => { if (busy) event.preventDefault(); }}>Continue</Link>
        </OnboardingButton>
      </OnboardingActions>
    </OnboardingCard>
  );
}
