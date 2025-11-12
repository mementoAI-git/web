import { useRef, useState } from "react";
import { Sheet } from "react-modal-sheet";
import endpoint from "@/api/endpoint";
import { ModalCloseBtn } from "../modalLayout";
import { FooterBtnGroup } from "@/components/memory";
import { TextArea } from "@/components/memory";
import useFetcher from "@/hooks/use-fetcher";
import useFileUpload from "@/hooks/use-file-upload";
import { useModal } from "@/hooks/use-modal";
import { mutate } from "swr";
import { v4 as uuidv4 } from "uuid";

interface ContentProps {
  data: any;
}

function Content({ data: memory }: ContentProps) {
  const { push, close } = useModal();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(memory.body);
  const { trigger, isMutating } = useFetcher(`${endpoint.memories}/${memory._id}`, "put");

  const handleContinueBtn = async () => {
    if (isMutating) return;
    if (text !== memory.body) {
      await trigger({ body: text });
      mutate(endpoint.memories);
    }
    push?.("set-tag-permission", { memory, isNew: false });
  };

  const { files, handleUpload, setFiles } = useFileUpload();

  const handleAddFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleDiscard = () => {
    setFiles([]);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (!selectedFiles.length) return;

    selectedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleUpload({
          id: uuidv4(),
          file,
          base64: reader.result as string,
          progress: 0,
        });
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/heic,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
      <div className="space-y-6">
        <h4 className="modal-title">{memory?.title}</h4>
        <TextArea
          value={text}
          name="body"
          files={files}
          attachments={memory?.attachments}
          onChange={(event) => setText(event.target.value)}
        />
      </div>
      <FooterBtnGroup
        onAddFileBtnClick={handleAddFileClick}
        onDiscard={handleDiscard}
        onSave={handleContinueBtn}
        disabled={files.some((file) => !file.uploadedFile)}
        saving={isMutating}
      />
    </div>
  );
}

export function UpdateMemory({ data }: ContentProps) {
  const { close } = useModal();

  return (
    <div>
      <div className="modal-container hidden !min-w-[618px] sm:block">
        <ModalCloseBtn onClick={() => close("edit-memory")} />
        <Content data={data} />
      </div>
      <Sheet
        detent="content"
        className="block sm:hidden"
        isOpen
        onClose={() => close("edit-memory")}
        snapPoints={[0.5, 0.75, 1]}
        initialSnap={1}
      >
        <Sheet.Container className="bg-sand-1">
          <Sheet.Header className="rounded-3xl bg-sand-1" />
          <Sheet.Content className="bg-sand-1 px-4 pb-6">
            <ModalCloseBtn className="!relative ml-auto mb-2 !right-0 !top-0" onClick={() => close("edit-memory")} />
            <Content data={data} />
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop />
      </Sheet>
    </div>
  );
}