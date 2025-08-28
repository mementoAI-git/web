import Chatinput from "@/components/Form/ChatInput";
import COnversationHeader from "./ConversationHeader";

export default function Reply() {
  return (
    <div className="page-viewport hide-scrollbar">
      <div className="container">
        <div className="py-12 space-y-6">
          {/* Conversation Header */}
          <COnversationHeader />
        </div>
        <div className="px-5">
          <div className="max-w-[520px] w-full ml-auto bg-sand-3 py-3 px-4 rounded-xl">
            <span className="font-georgia text-sand-12 ">
              Lorem ipsum dolor sit amet consectetur.
              Justo velit nunc viverra eget ut et mi.
              Pulvinar nec varius egestas diam arcu augue.
              Ut consequat quis praesent in et eleifend.
              Mattis orci ipsum risus viverra turpis pulvinar eu?
            </span>
          </div>
          <div className="w-full py-3 px-4">
            <span className="font-georgia text-sand-12">
              Lorem ipsum 😂 dolor sit amet consectetur.
              Justo velit nunc viverra eget ut et mi.
              Pulvinar nec varius egestas diam arcu augue.
              Ut consequat quis praesent in et eleifend.
              Mattis orci ipsum risus viverra turpis pulvinar eu.
              Donec massa cursus euismod arcu purus mi dictum arcu.
              Mauris tincidunt vestibulum commodo et proin. In magna ultrices arcu iaculis sem arcu id. 👋🏼
            </span>
          </div>
        </div>
      </div>
      <div className="container">
        <Chatinput />
      </div>
    </div>
  )
}