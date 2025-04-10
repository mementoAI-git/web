import { usePrompt } from "@/hooks/use-prompt"
import confetti from "@/public/image/confetti.png"
import Image from "next/image";

export default function SharePost() {
  const { navigations } = usePrompt()
  if (navigations[0] !== "share") return;
  return (
    <div>
      <Image className="mx-auto object-contain size-16" src={confetti} alt="confetti" />
      <div>
        <span>New Post added</span>
        <span>You have saved a new entry to memento</span>
      </div>
      <div>
        <div>
          <span>Share link</span>
          <div>
            <span>www.memento.io/post/73f9320d</span>
            <span>Copy</span>
          </div>
        </div>
        <div>
          {/* TODO: See how you can make this component reuseable */}
          <div className="flex justify-between items-center gap-6 mb-3">
            <div className="flex-1 border-t border-grey-100" />
            <span className="font-geist text-sm text-grey-200">Or sign in with</span>
            <div className="flex-1 border-t border-grey-100" />
          </div>
          <div>
            {/* TODO: social icons */}
          </div>
        </div>
      </div>
      <div>
        <button>Add another entry</button>
        <button>Dismiss</button>
      </div>
    </div>
  )
}