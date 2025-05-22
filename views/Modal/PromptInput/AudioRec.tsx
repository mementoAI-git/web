import AletHexagonIcon from "@/public/icon/alert-hexagon.svg";
import RecIndicator from "@/components/RecIndicator";
import useRecorder from "@/hooks/use-recorder";
import React, { useState } from "react";
import { AudioRecButtons } from "./RecButtons";
import AudioVisualizer from "@/components/AudioVisualizer";
import { toast } from "sonner";
import PromptLayout from "./Layout";
import { fileUploadFetcher } from "@/api/fetcher";
import endpoint from "@/api/endpoint";
import useSWRMutation from "swr/mutation";
import { useModal } from "@/hooks/use-modal";
import AudioPlayer from "@/components/Player/AudioPlayer";
import { isEmpty } from "@/utility";

const fileType = "audio/webm";

export default function AudioRec({ data }) {
  const { push } = useModal()
  const [editMode, setEditMode] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const recorder = useRecorder(stream, fileType);
  const { isMutating, trigger } = useSWRMutation(
    endpoint.replyPrompt,
    fileUploadFetcher,
  );

  const handleSave = async () => {
    const blob = new Blob(recorder.chucks, { type: fileType });
    const file = new File([blob], "recorded.webm", { type: fileType });
    await trigger({ file, prompt_id: data?.prompt });
    push("set-tag-permission", data);
  };

  const handleDiscard = () => {
    if (recorder.recording) {
      recorder.stop()
    }
    recorder.reset()
  };

  const startRec = () => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (stream) {
          setStream(stream);
          setTimeout(recorder.start, 2000);
          setEditMode(true);
        }
      })
      .catch((error) => {
        toast.error("Mic access denied or not available.", {
          className: "!text-danger",
        });
      });
  };

  return (
    <PromptLayout
      editMode={editMode}
      onDiscard={handleDiscard}
      onSave={handleSave}
      loading={recorder.recording || !isEmpty(recorder.chucks)}
      saving={isMutating}
      type="audio"
      memory={data}
    >
      <div>
        <div className="flex items-center justify-center rounded-t-2xl bg-grey-400 py-1 text-grey-800">
          <div className="flex items-center gap-1">
            <AletHexagonIcon width={16} height={16} />
            <span className="font-inter text-xs">
              Max audio recording length is 4 minutes
            </span>
          </div>
        </div>
        {
          recorder.url ?
            <AudioPlayer src={recorder.url} className="min-h-100 rounded-b-2xl rounded-t-none" /> :
            <div className="flex min-h-100 w-full items-center justify-center rounded-b-2xl border border-t-0 border-grey-400">
              <div>
                <div className="flex flex-col gap-3 self-center">
                  <div className="flex items-center gap-2">
                    <RecIndicator
                      counter={recorder.timer}
                      recoding={recorder.recording}
                    />
                    <AudioVisualizer stream={stream} recorder={recorder.recorder} />
                  </div>
                  <AudioRecButtons {...{ ...recorder, start: startRec }} />
                </div>
              </div>
            </div>
        }
      </div>
    </PromptLayout>
  );
}
