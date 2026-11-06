import endpoint from "@/api/endpoint";
import { Selectinput, Textinput } from "@/components/Form";
import { ModalCloseBtn } from "../modalLayout";
import Spinner from "@/components/spinner";
import useFetcher from "@/hooks/use-fetcher";
import { useModal } from "@/hooks/use-modal";
import { isEmpty } from "@/utility";
import type { IMemory } from "@/utility/interface";
import { useMemo, useState, type Dispatch, type KeyboardEvent, type SetStateAction } from "react";
import { Sheet } from "react-modal-sheet";
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
        setValue((prev) => [...prev, tag]);
      }
      setInput("");
    }
  };

  const removeTag = (tag: string) => {
    setValue((p) => p.filter((_p) => _p !== tag));
  };

  const predefinedTags = [
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
  ];

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
                className="mem-tags !bg-transparent !font-normal !text-text-neutral-weak"
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
            className="w-full flex-1 outline-0 placeholder:text-text-neutral-weaker"
            onKeyDown={onKeyDown}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {predefinedTags.map((tag, i) => {
          const isSelected = values.includes(tag);
          return (
            <span
              onClick={() => addTag(tag)}
              key={i}
              className={`mem-tags cursor-pointer  transition-colors ${isSelected
                ? "!bg-[#EBD2A9] text-black!"
                : "!bg-transparent !text-text-neutral-weak hover:!bg-red-50"
                }`}
            >
              {tag}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function Content({ data }: ISetTagPermissionsProps) {
  const { memory, isNew = false } = data
  const { open } = useModal();
  const [tags, setTag] = useState<string[]>(memory?.tags || []);
  const [title, setTitle] = useState<string>(memory?.title || "");
  const [level, setLevel] = useState(memory?.level || "1");
  const { trigger, isMutating } = useFetcher(`${endpoint.memories}/${memory?._id}`, "put");

  const handleSubmit = async () => {
    const result = await trigger({ level, title, status: "save", tags });
    if (result.success) {

      mutate((key) => typeof key === 'string' && key.startsWith(endpoint.stories));
      open?.("share-post", { id: memory?._id });
      toast.success(isNew ? "Memory created successfully" : result?.message)
    }
  };

  const handleDiscard = () => {
    if (!memory) return;
    setLevel(memory.level || "1");
    setTitle(memory.title || "");
    setTag(memory.tags || []);
  };

  const hasChanges = useMemo(() => {
    if (!memory) {
      return false;
    }
    return (
      memory.tags !== tags ||
      memory.title !== title ||
      memory.level !== level
    );
  }, [memory, tags, title, level]);

  return (
    <div className="w-full">
      <h4 className="modal-title mb-3 text-2xl! sm:text-4xl!">
        {
          isNew ?
            "One more thing..." :
            "Edit tags and permissions"
        }
      </h4>
      <small className="font-inter text-sm text-text-neutral-weak">
        Choose a title and a tag for this entry, this allows Memento correctly
        categorize your contents.
      </small>
      <form className="flex flex-col gap-6 mt-3">
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
        <button onClick={handleDiscard} className="btn-outline bo">Discard</button>
        <button disabled={!hasChanges} onClick={handleSubmit} className="btn flex items-center gap-2">
          Submit
          <Spinner loading={isMutating} className="size-4!" />
        </button>
      </div>
    </div>
  );
}

export default function SetTagPermissions({ data }: ISetTagPermissionsProps) {
  const { close } = useModal();

  return (
    <div>
      <div className="hidden sm:block modal-container">
        <ModalCloseBtn onClick={() => close?.("set-tag-permission")} />
        <Content data={data} />
      </div>
      <Sheet
        detent="content"
        className="block md:hidden"
        isOpen
        onClose={() => close("set-tag-permission")}
        snapPoints={[0, 1]}
        initialSnap={1}
      >
        <Sheet.Container className="max-h-[80dvh] overflow-hidden bg-bg-raised" >
          <Sheet.Header className="bg-bg-raised rounded-3xl" />
          <Sheet.Content className="max-h-[80dvh] min-h-0 overflow-y-auto overscroll-contain bg-bg-raised px-4 pb-6">
            <ModalCloseBtn className="relative! ml-auto mb-2 right-0! top-0!" onClick={() => close?.("set-tag-permission")} />
            <Content {...{ data }} />
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop />
      </Sheet>
    </div>
  );
}