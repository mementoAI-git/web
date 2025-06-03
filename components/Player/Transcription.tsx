import { useState } from "react"

export default function Transcription() {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <span onClick={() => setShow(p => !p)} className="mx-auto cursor-pointer hover:underline underline-offset-2 block text-center font-inter text-xs text-secondary">
        {show ? "Hide" : "Show"} transcription
      </span>
      {
        show &&
        <div className="absolute  overflow-x-hidden overflow-y-auto max-h-110.5 top-65 left-1/2 -translate-1/2 bg-grey-600 rounded-2xl p-5 w-129.5">
          <span className="text-[30px] font-inter font-medium text-white">
            Lorem ipsum dolor sit amet consectetur. Gravida nulla tellus sed aliquet pulvinar. Metus nulla turpis massa vitae non enim. Cras in aliquet tincidunt at varius cras ullamcorper ut mattis. Cursus sed vitae pellentesque tortor tincidunt.
            Tristique scelerisque volutpat leo sodales convallis arcu. Id id fringilla semper tellus. Felis imperdiet sodales ac cursus ante at arcu ut aliquet. Dui dui morbi amet sem faucibus malesu
          </span>
        </div>
      }
    </div>
  )
}