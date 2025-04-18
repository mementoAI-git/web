import { usePrompt } from "@/hooks/use-prompt";
import FileUploadInput from "./FileUploadInput";
import { useCallback, useState } from "react";
import FileUploadItem from "./FileUploadItem";
import { IFile } from "@/utility/interface";
import useSWRMutation from "swr/mutation";
import endpoint from "@/api/endpoint";
import { fileUploadFetcher } from "@/api/fetcher";
import useFetcher from "@/hooks/use-fetcher";
import Spinner from "@/components/Spinner";

export interface IFileState {
  file: File;
  result?: IFile;
  progress: number;
  id: string; // generated id
}

export default function UploadFiles() {
  const { navigations, data, back } = usePrompt();
  const [files, setFiles] = useState<IFileState[]>([]);
  const { trigger: uploadFile } = useSWRMutation(
    endpoint.upload,
    fileUploadFetcher,
  );
  const { trigger: deleteFile } = useFetcher(endpoint.files, "delete");
  const { trigger: addToPost, isMutating: adding } = useFetcher(
    endpoint.replyPrompt,
  );

  const handleDeleteFile = async (file: IFileState) => {
    console.log(file.result);
    if (!file.result.name) return;
    await deleteFile(file.result.name);
    setFiles((files) => files.filter((f) => f.id !== file.id));
  };

  const handleAddToPost = async () => {
    if (adding) return;
    const attachments = files.map((f) => f.result._id);
    await addToPost({ attachments, prompt_id: data?.prompt });
    setFiles([]);
    back();
  };

  const handleOnUpload = useCallback(async (file: IFileState) => {
    setFiles((prev) => [...prev, file]);

    const result = await uploadFile({
      file: file.file,
      onProgress: (p: number) => {
        setFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, progress: p } : f)),
        );
      },
    });

    setFiles((prev) =>
      prev.map((f) =>
        f.id === file.id ? { ...f, result: result.data[0] } : f,
      ),
    );
  }, []);

  if (navigations[0] !== "file-upload") return;
  return (
    <div>
      <h4 className="modal-title">Upload your images or videos</h4>
      <div className="mt-6 flex flex-col">
        <div className="flex max-h-[660px] min-h-[425px] flex-col gap-6">
          <FileUploadInput onUpload={handleOnUpload} />
          {files.length > 0 && (
            <div className="max-h-[300px] flex-1 space-y-4 overflow-y-auto">
              {files.map((f, i) => (
                <FileUploadItem onDelete={handleDeleteFile} file={f} key={i} />
              ))}
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-outline">Discard</button>
          <button
            onClick={handleAddToPost}
            disabled={files.length === 0}
            className="btn"
          >
            Add to post
            <Spinner loading={adding} />
          </button>
        </div>
      </div>
    </div>
  );
}
