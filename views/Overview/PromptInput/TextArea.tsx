import { useEffect, useState } from "react";
import PromptInputLayout from "./Layout";
import { usePrompt } from "@/hooks/use-prompt";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import { isEmpty } from "@/utility";
import ImageThumbnail from "@/components/ImageThumbnail";

export default function TextArea() {
  const { data, set, push } = usePrompt();
  const [text, setText] = useState(data?.body);
  const { isMutating, trigger } = useFetcher(endpoint.replyPrompt);

  const handeleSave = async () => {
    if (text === data?.body) return;
    await trigger(
      { text, prompt_id: data?.prompt },
      {
        revalidate: false,
        populateCache(result, currentData) {
          if (result?.data) {
            set("data", result?.data);
            return { ...currentData, data: result.data };
          }
          return currentData;
        },
      },
    );
    push("tag-permission");
  };

  const handeleDiscard = () => {
    setText(data?.body);
  };

  useEffect(() => {
    if (data?.body) {
      setText(data?.body);
    }
  }, [data?.body]);
  return (
    <PromptInputLayout
      editMode={text !== data?.body}
      onDiscard={handeleDiscard}
      onSave={handeleSave}
      saving={isMutating}
    >
      <div className="flex min-h-[425px] flex-col gap-6 rounded-2xl bg-grey-700 p-3 font-inter text-xs">
        {!isEmpty(data?.attachments) && (
          <div className="relative size-fit">
            <ImageThumbnail
              boxClassName="!rounded-[12px] !border-2"
              images={data?.attachments}
              size={69}
            />
            {data?.attachments.length > 3 && (
              <div className="absolute top-0 -right-10 z-40 rounded-full border border-white bg-secondary px-1.5 py-0.5 font-inter text-xs font-light text-[#C1FDC5]">
                +{data?.attachments.length} files
              </div>
            )}
          </div>
        )}

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="size-full flex-1 resize-none outline-0 placeholder:text-[#C7C9C8]"
          placeholder="Tap to start typing..."
        ></textarea>
      </div>
    </PromptInputLayout>
  );
}
