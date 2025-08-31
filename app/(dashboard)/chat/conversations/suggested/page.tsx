import Topic from "@/components/Topic";

export default function SuggestedConversation() {
  return (
    <div className="container">
      <div className="pb-4 pt-12">
        <h2 className="text-[40px] leading-[48px] font-normal font-canela text-sand-12">
          Suggested conversations
        </h2>
      </div>
      <div className="overflow-y-auto hide-scrollbar scroll-smooth pt-8" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        <div className="grid grid-cols-3 gap-6">
          <Topic tag="Career" className="p-3" />
          <Topic tag="Love" className="p-3" />
          <Topic tag="Childhood" className="p-3" />
          <Topic tag="Career" className="p-3" />
          <Topic tag="Love" className="p-3" />
          <Topic tag="Childhood" className="p-3" />
          <Topic tag="Career" className="p-3" />
          <Topic tag="Love" className="p-3" />
          <Topic tag="Childhood" className="p-3" />
        </div>
        <div className="w-full h-20" />
      </div>
    </div>
  )
}