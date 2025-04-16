import { Button } from "@/components/Buttons";
import { useModal } from "@/hooks/use-modal";
import welcomeImage from "@/public/image/welcome.png"
import Image from "next/image";

export default function Welcome() {
  const { close } = useModal()
  return (
    <div className="modal-container !max-w-138.5 space-y-12">
      <Image src={welcomeImage} className="object-contain max-w-100 h-auto mx-auto" alt="Welcome to memento" />
      <div className="space-y-6">
        <h4 className="modal-title text-center">Welcome to Memento</h4>
        <span className="text-center block text-grey-200 text-2xl font-inter font-medium">You’re now ready to explore our product</span>
        <Button onClick={() => close()} title="Start exploring" />
      </div>
    </div>
  )
}