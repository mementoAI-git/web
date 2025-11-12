"use client";

import { useEffect, useRef, useState } from "react";
import { ModalWrapper } from "./modalLayout";
import { useModal } from "@/hooks/use-modal";
import { FooterBtnGroup } from "@/components/memory";
import useForm from "@/hooks/use-form";
import endpoint from "@/api/endpoint";
import { fileUploadFetcher } from "@/api/fetcher";
import useSWRMutation from "swr/mutation";
import { AudioRecorder, VideoRecorder } from "@/components/recorder";
import { TextArea } from "@/components/memory";
import useFetcher from "@/hooks/use-fetcher";
import { isEmpty } from "@/utility";

const initial = {
  body: "",
  file: null as File | null,
  prompt_id: "",
};

interface PromptInputProps {
  data: any;
  isMobile?: boolean;
}

export default function PromptInput({ data, isMobile = false }: PromptInputProps) {
  const { close, open, push } = useModal();
  const audioRef = useRef<any>(null);
  const videoRef = useRef<any>(null);

  const [memory, setMemory] = useState(data);
  const [editMode, setEditMode] = useState(false);
  const [recording, setRecording] = useState(false);
  const [type] = useState<"text" | "audio" | "video">("text");

  const { trigger: getPromptResponse, isMutating: isLoading } = useFetcher(
    data?.prompt ? `${endpoint.replyPrompt}/${data.prompt}` : null,
    "get",
  );
  const { trigger, isMutating } = useSWRMutation(endpoint.replyPrompt, fileUploadFetcher);

  const { values, handleChange, setValues, handleSubmit, handleValue } = useForm({
    initial,
    async onSubmit(payload) {
      payload.prompt_id = memory?.prompt;
      const result = await trigger(payload as any);
      if (result?.success) {
        open?.("set-tag-permission", { memory: result.data, isNew: isEmpty(data?.prompt) });
        setEditMode(false);
      }
    },
  });

  const onFinish = (file: File) => {
    handleValue("file", file);
    setRecording(false);
  };

  const onStart = () => {
    setEditMode(true);
    setRecording(true);
  };

  const handleDiscard = () => {
    setEditMode(false);
    setRecording(false);
    if (type === "text") {
      setValues((previous) => ({ ...previous, body: memory?.body || "" }));
    } else {
      setValues((previous) => ({ ...previous, file: null }));
      videoRef.current?.reset?.();
      audioRef.current?.reset?.();
    }
  };

  const handleClose = () => {
    handleDiscard();
    close?.("prompt");
  };

  useEffect(() => {
    if (!data?.prompt) return;
    getPromptResponse()
      ?.then(({ data: result }) => {
        if (result) {
          setMemory(result);
          if (result?.body) {
            handleValue("body", result.body);
          }
        }
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.prompt]);

  const footer = (
    <FooterBtnGroup
      onAddFileBtnClick={() => push("file-upload", memory?._id || null)}
      onDiscard={handleDiscard}
      onSave={handleSubmit}
      disabled={(["audio", "video"].includes(type) && recording) || isLoading}
      saving={isMutating}
      editMode={editMode || (memory?.body ? values.body !== memory?.body : !isEmpty(values.body))}
    />
  )

  return (
    <ModalWrapper
      isMobile={isMobile}
      header={<h2 className="text-xl font-geist font-semibold text-secondary">Reply Prompt</h2>}
      footer={footer}
      onClose={handleClose}
    >
      <div className="space-y-3">
        <h4 className="modal-title">{memory?.title}</h4>
        {
          type === "audio" ?
            <AudioRecorder ref={audioRef} {...{ onFinish, onStart }} /> :
            type === "video" ?
              <VideoRecorder ref={videoRef} {...{ onFinish, onStart }} /> :
              <TextArea
                value={values.body}
                name="body"
                attachments={memory?.attachments}
                onChange={handleChange}
              />
        }
      </div>
    </ModalWrapper >
  );
}

