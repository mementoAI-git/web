import endpoint from "@/api/endpoint";
import { Selectinput, Textinput } from "@/components/Form";
import Spinner from "@/components/Spinner";
import useFetcher from "@/hooks/use-fetcher";
import { usePrompt } from "@/hooks/use-prompt";
import { Dispatch, KeyboardEvent, SetStateAction, useState } from "react";

interface ITaginput {
  values: string[];
  setValue: Dispatch<SetStateAction<string[]>>;
}

function Taginput({ values, setValue }: ITaginput) {
  const [input, setInput] = useState("");

  const addTag = (tag: string) => {
    if (values.includes(tag)) return;
    setValue((p) => [...p, tag]);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    console.log(e.key);
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

export default function TagAndPermissions() {
  const { navigations, push, data } = usePrompt();
  const [tags, setTag] = useState<string[]>(data?.tags || []);
  const [level, setLevel] = useState(data?.level || "1");
  const { trigger, isMutating } = useFetcher(endpoint.replyPrompt);

  const handleSubmit = async () => {
    await trigger({ level, tags, prompt_id: data?.prompt });
    push("share");
  };

  if (navigations[0] !== "tag-permission") return;
  return (
    <div>
      <h4 className="modal-title">One more thing...</h4>
      <small className="font-inter text-sm text-grey-600">
        Choose a title and a tag for this entry, this allows Memento correctly
        categorize your contents.
      </small>
      <form className="flex flex-col gap-6">
        <Textinput label="title" disabled value={data?.title} />
        <Taginput values={tags} setValue={setTag} />
        <Selectinput
          label="Set permission level for this post"
          placeholder="Set permission level"
          data={[
            { label: "Level 1", value: "1" },
            { label: "Level 2", value: "2" },
            { label: "Level 3", value: "3" },
          ]}
          value={level}
          onChange={(e) => setLevel(e.target.value)}
        />
      </form>
      <div className="mt-6 flex justify-end gap-3">
        <button className="btn-outline">Discard</button>
        <button onClick={handleSubmit} className="btn flex items-center gap-2">
          Submit
          <Spinner loading={isMutating} className="!size-4" />
        </button>
      </div>
    </div>
  );
}
