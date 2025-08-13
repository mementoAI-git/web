import ChatIcon from "@/public/icon/chat.svg";

export default function Chat() {
  return (
    <div className="page-viewport hide-scrollbar">
      <div className="w-full">
        <div className="w-full py-3">
          <div className="w-full mx-auto max-w-[1038px] flex items-center justify-between">
            <div className="bg-sand-2 p-3 rounded-xl flex items-center gap-2">
              <div className="size-5 flex items-center justify-center text-sand-8"><ChatIcon /></div>
              <span className="text-sand-10 text-sm font-inter">Recent Conversations</span>
            </div>
            <div className="size-11 bg-sand-2 flex items-center rounded-xl justify-center text-sand-8">
              <ChatIcon className="size-5" />
            </div>
          </div>
        </div>
        <div className="container space-y-16 py-12">
          <h4 className="text-center font-canela text-[32px] leading-[38px] text-sand-12">
            Hey Groot, What’s on your mind today?
          </h4>
          <div className="w-full h-[228px] max-w-[760px] gap-10 rounded-2xl border border-sand-4 p-12 bg-white mx-auto shadow-[0px_4px_8px_0px_#AB7E2B1C]">
            <div></div>
            <div>
              <div></div>
              <div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}