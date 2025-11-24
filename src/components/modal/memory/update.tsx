import { useRef, useState, useCallback } from "react";
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
import { deleteFetcher } from "@/api/fetcher";
import { resolvePath } from "@/utility";
import type { IFile } from "@/utility/interface";

interface ContentProps {
  data: any;
}

function Content({ data: memory }: ContentProps) {
  const { push } = useModal();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(memory.body);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<string[]>([]);
  const [currentAttachments, setCurrentAttachments] = useState<IFile[]>(memory?.attachments || []);
  const { trigger, isMutating } = useFetcher(`${endpoint.memories}/${memory._id}`, "put");

  const handleContinueBtn = async () => {
    if (isMutating) return;
    
    const payload: any = {};
    
    // Include body if changed
    if (text !== memory.body) {
      payload.body = text;
    }
    
    // Include new attachment IDs from uploaded files
    const newAttachmentIds = files.filter(f => f.uploadedFile).map(f => f.uploadedFile._id);
    // Include current attachments (excluding removed ones) plus new uploads
    const remainingAttachmentIds = currentAttachments.map(a => a._id);
    const allAttachmentIds = [...remainingAttachmentIds, ...newAttachmentIds];
    if (allAttachmentIds.length > 0 || newAttachmentIds.length > 0 || removedAttachmentIds.length > 0) {
      payload.attachments = allAttachmentIds;
    }
    
    // Include removed attachment IDs
    if (removedAttachmentIds.length > 0) {
      payload.removeAttachments = removedAttachmentIds;
    }
    
    // Only trigger if there are changes
    if (Object.keys(payload).length > 0) {
      await trigger(payload);
      mutate(endpoint.memories);
    }
    
    push?.("set-tag-permission", { memory, isNew: false });
  };

  const { files, handleUpload, handleDeleteFile, setFiles } = useFileUpload();

  const handleRemoveAttachment = useCallback(async (attachmentId: string) => {
    const attachment = currentAttachments.find(a => a._id === attachmentId);
    
    if (attachment) {
      // Delete file from server
      try {
        await deleteFetcher(resolvePath(endpoint.files, { id: attachment.name }), { arg: {} });
      } catch (error) {
        console.error("Failed to delete file from server", error);
      }
      
      // Track removal and update local state
      setRemovedAttachmentIds(prev => [...prev, attachmentId]);
      setCurrentAttachments(prev => prev.filter(a => a._id !== attachmentId));
    }
  }, [currentAttachments]);

  const handleRemoveFile = useCallback(async (fileId: string) => {
    const fileToRemove = files.find(f => f.id === fileId);
    if (fileToRemove) {
      if (fileToRemove.uploadedFile) {
        await handleDeleteFile(fileToRemove);
      } else {
        // If file hasn't been uploaded yet, just remove from state
        setFiles(prev => prev.filter(f => f.id !== fileId));
      }
    }
  }, [files, handleDeleteFile, setFiles]);

  const handleAddFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleDiscard = () => {
    setFiles([]);
    setRemovedAttachmentIds([]);
    setCurrentAttachments(memory?.attachments || []);
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
        accept="image/png,image/jpeg,image/jpg,image/heic"
        onChange={handleFileSelect}
        className="hidden"
      />
      <div className="space-y-6">
        <h4 className="modal-title">{memory?.title}</h4>
        <TextArea
          value={text}
          name="body"
          files={files}
          attachments={currentAttachments}
          onChange={(event) => setText(event.target.value)}
          onRemoveFile={handleRemoveFile}
          onRemoveAttachment={handleRemoveAttachment}
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