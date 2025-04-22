"use client";

import VideoRec from "./VideoRec";
import TextArea from "./TextArea";
import AudioRec from "./AudioRec";

export default function PromptInput({ data }) {
  if (data.type === "video") {
    return <VideoRec data={data.memory} />
  }
  if (data.type === "audio") {
    return <AudioRec data={data.memory} />
  }
  return <TextArea data={data.memory} />

}
