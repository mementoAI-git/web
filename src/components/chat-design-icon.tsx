import attachment from "@/assets/icon/chat/attachment.svg";
import microphone from "@/assets/icon/chat/microphone.svg";
import phone from "@/assets/icon/chat/phone.svg";
import copy from "@/assets/icon/chat/copy.svg";
import reply from "@/assets/icon/chat/reply.svg";
import search from "@/assets/icon/chat/search.svg";
import audio from "@/assets/icon/chat/audio.svg";
import more from "@/assets/icon/chat/more.svg";
import sun from "@/assets/icon/chat/sun.svg";
import plus from "@/assets/icon/explore-topic/plus.svg";
import send from "@/assets/icon/explore-topic/send.svg";

const icons = { attachment, microphone, phone, copy, reply, search, audio, more, sun, plus, send };
/** Original 20px Figma assets, tinted with the surrounding semantic foreground. */
export function ChatDesignIcon({ name }: { name: keyof typeof icons }) {
  return <span aria-hidden="true" className="inline-block size-5 shrink-0 bg-current" style={{ maskImage: `url("${icons[name]}")`, maskSize: "20px 20px", maskRepeat: "no-repeat", maskPosition: "center" }} />;
}
