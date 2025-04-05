import { TextareaHTMLAttributes } from "react";

interface ITextarea extends TextareaHTMLAttributes<HTMLTextAreaElement> {

}
export default function TextArea(props: ITextarea) {

  return (
    <textarea {...props} className="placeholder:text-[#C7C9C8] resize-none w-full outline-0 p-3 rounded-2xl bg-grey-700 text-xs font-inter min-h-[425px]" placeholder="Tap to start typing..."></textarea>
  )
}