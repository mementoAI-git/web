
export default function Loading() {
  return (
    <div className="w-full flex justify-center">
      <div style={{ height: 'calc(100vh - 88px)' }} className="mx-auto overflow-x-hidden flex flex-col w-full max-w-220 flex-1">
        <div className="flex-1 overflow-y-auto px-4 py-6 pt-8  space-y-4 overflow-x-hidden flex flex-col gap-2 justify-end">
          <div className="bg-gray-200 h-18 w-81 rounded-xl" />
          <div className="bg-gray-200 h-18 w-81 rounded-xl ml-auto" />
          <div className="bg-gray-200 h-18 w-81 rounded-xl" />
          <div className="bg-gray-200 h-18 w-81 rounded-xl ml-auto" />
        </div>
        <div className="pb-4">
          <div className="w-full bg-gray-200 h-56 rounded-2xl"></div>
        </div>
      </div>
    </div>
  )
}