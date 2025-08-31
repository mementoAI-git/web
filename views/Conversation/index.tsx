import Chatinput from "@/components/Form/ChatInput";
import COnversationHeader from "./Header";
import Bubble from "./Bubble";

const mockText = `Lorem ipsum 😂 dolor sit amet consectetur.
              Justo velit nunc viverra eget ut et mi.
              Pulvinar nec varius egestas diam arcu augue.
              Ut consequat quis praesent in et eleifend.
              Mattis orci ipsum risus viverra turpis pulvinar eu.
              Donec massa cursus euismod arcu purus mi dictum arcu.
              Mauris tincidunt vestibulum commodo et proin. In magna ultrices arcu iaculis sem arcu id. 👋🏼`

export default function Conversation() {
  return (
    <div className="page-viewport hide-scrollbar">
      <div className="container flex-1">
        <div className="py-12 space-y-6">
          {/* Conversation Header */}
          <COnversationHeader />
        </div>
        <div className="px-5 space-y-6">
          <Bubble text={mockText} />
          <Bubble role="ai" text={mockText} />
          <Bubble text={mockText} />
          <Bubble role="ai" text={mockText} />
          <div className="w-full h-5" />
        </div>
      </div>
      <div className="sticky bottom-0 pb-4 bg-background">
        <div className="container">
          <Chatinput />
        </div>
      </div>
    </div>
  )
}