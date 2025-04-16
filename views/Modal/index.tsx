import { useModal } from "@/hooks/use-modal"
import { SharePost } from "./SharePost"
import Welcome from "./Welcome"

export default function Modal() {
  const { state } = useModal()
  if (!state) return null
  return (
    <div className={`modal-overlay z-50 bg-[rgba(94,94,94,0.5)] ${state ? "flex" : "hidden"} `}>
      {
        state.name === "share-post" ?
          <SharePost data={state.props} /> :
          state.name === "welcome" ?
            <Welcome /> :
            null
      }
    </div>
  )
}