import endpoint from "@/api/endpoint";
import { Selectinput, Textinput } from "@/components/Form";
import { ModalCloseBtn } from "@/components/ModalLayout";
import Spinner from "@/components/Spinner";
import useFetcher from "@/hooks/use-fetcher";
import { useModal } from "@/hooks/use-modal";
import { isEmpty } from "@/utility";
import { IMemory } from "@/utility/interface";
import { Dispatch, KeyboardEvent, SetStateAction, useMemo, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";

interface ITaginput {
  values: string[];
  setValue: Dispatch<SetStateAction<string[]>>;
}

interface ISetTagPermissionsProps {
  data: {
    memory: IMemory
    isNew?: boolean
  }
}

function Taginput({ values, setValue }: ITaginput) {
  const [input, setInput] = useState("");

  const addTag = (tag: string) => {
    if (values.includes(tag)) return;
    setValue((p) => [...p, tag]);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = input.trim();

      if (!values.includes(tag)) {
        setValue([...values, tag]);
      }
      setInput("");
    }
  };

  const removeTag = (tag: string) => {
    setValue((p) => p.filter((_p) => _p !== tag));
  };

  return (
    <div>
      <label className="input-label">Tags</label>
      <div className="input-base min-h-40 !flex-wrap !justify-start">
        <div className="mt-2 flex items-center gap-2">
          <div className="flex flex-wrap gap-2">
            {values.map((v, i) => (
              <span
                onClick={() => removeTag(v)}
                key={i}
                className="mem-tags !bg-transparent !font-normal !text-grey-600"
              >
                {v}
              </span>
            ))}
          </div>
          <input
            placeholder={
              values.length > 0
                ? ""
                : "Tap tags below to add here or type in manually"
            }
            className="w-full flex-1 outline-0 placeholder:text-[#000D4D73]"
            onKeyDown={onKeyDown}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {[
          "family & friends",
          "career & work",
          "life",
          "politics",
          "relationship",
          "traveling",
          "homestead",
          "food & drinks",
          "early childhood",
          "culture",
        ].map((tag, i) => (
          <span
            onClick={() => addTag(tag)}
            key={i}
            className="mem-tags !bg-transparent !font-normal !text-grey-600"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SetTagPermissions({ data }: ISetTagPermissionsProps) {
  const { memory, isNew = false } = data
  const { open, close } = useModal();
  const [tags, setTag] = useState<string[]>(memory?.tags || []);
  const [title, setTitle] = useState<string>(memory?.title || "");
  const [level, setLevel] = useState(memory?.level || "1");
  const { trigger, isMutating } = useFetcher(`${endpoint.memories}/${memory?._id}`, "put");

  const handleSubmit = async () => {
    const result = await trigger({ level, title, status: "save", tags });
    if (result.success) {
      mutate(`${endpoint.memories}?page=1`)
      open("share-post", memory?._id);
      toast.success(isNew ? "Memory created successfully" : result?.message)
    }
  };

  const handleDiscard = () => {
    if (!memory) return;
    setLevel(memory?.level)
    setTitle(memory?.title)
    setTag(memory?.tags)
  }

  const editMode = useMemo(() => {
    if (memory) {
      return memory?.tags !== tags || memory?.title !== title || memory?.level !== level
    }
    return false
  }, [memory?.tags, memory?.title, memory?.level])

  return (
    <div className="modal-container">
      <ModalCloseBtn onClick={() => close("set-tag-permission")} />
      <h4 className="modal-title">One more thing...</h4>
      <small className="font-inter text-sm text-grey-600">
        Choose a title and a tag for this entry, this allows Memento correctly
        categorize your contents.
      </small>
      <form className="flex flex-col gap-6">
        <Textinput
          label="title"
          onChange={e => setTitle(e.target.value)}
          disabled={!isEmpty(memory.prompt)}
          value={title}
        />
        <Taginput values={tags} setValue={setTag} />
        <Selectinput
          label="Set permission level for this post"
          placeholder="Set permission level"
          data={[
            { label: "Level 1", value: "1" },
            { label: "Level 2", value: "2" },
            { label: "Level 3", value: "3" },
          ]}
          value={String(level)}
          onChange={(e) => setLevel(e.target.value)}
        />
      </form>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={handleDiscard} className="btn-outline">Discard</button>
        <button disabled={editMode} onClick={handleSubmit} className="btn flex items-center gap-2">
          Submit
          <Spinner loading={isMutating} className="!size-4" />
        </button>
      </div>
    </div>
  );
}
