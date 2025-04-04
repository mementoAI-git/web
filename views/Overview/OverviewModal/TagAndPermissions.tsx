import { Selectinput, Textinput } from "@/components/Form";
import { useState } from "react";

function Taginput() {
  const [values, setValue] = useState<string[]>([])

  const addTag = (tag: string) => {
    if (values.includes(tag)) return;
    setValue(p => [...p, tag])
  }

  const removeTag = (tag: string) => {
    setValue(p => p.filter(_p => _p !== tag))
  }
  return (
    <div>
      <label className="input-label">Tags</label>
      <div className="input-base !flex-wrap !justify-start min-h-40">
        <div className="flex flex-wrap gap-2 mt-2">
          {
            values.map((v, i) => (
              <span
                onClick={() => removeTag(v)}
                key={i}
                className="mem-tags !text-grey-600 !bg-transparent !font-normal"
              >{v}</span>
            ))
          }
        </div>
        <input
          placeholder={values.length > 0 ? "" : "Tap tags below to add here or type in manually"}
          className="outline-0 placeholder:text-[#000D4D73] flex-1"
        />
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {
          [
            "family & friends",
            "career & work",
            "life",
            "politics",
            "relationship",
            "traveling",
            "homestead",
            "food & drinks",
            "early childhood",
            "culture"
          ].map((tag, i) => (
            <span onClick={() => addTag(tag)} key={i} className="mem-tags !text-grey-600 !bg-transparent !font-normal">{tag}</span>
          ))
        }

      </div>
    </div>
  )
}

export default function TagAndPermissions() {
  return (
    <div>
      <h4 className="modal-title">One more thing...</h4>
      <small className="text-sm text-grey-600 font-inter">Choose a title and a tag for this entry, this allows Memento correctly categorize your contents.</small>
      <form className="flex flex-col gap-6">
        <Textinput label="title" />
        <Taginput />
        <Selectinput
          label="Set permission level for this post"
          placeholder="Set permission level"
          data={[
            { label: "Level 1", value: "1" },
            { label: "Level 2", value: "2" },
            { label: "Level 3", value: "3" }
          ]}
        />
      </form>
      <div className="flex mt-6 gap-3 justify-end">
        <button className="btn-outline">Discard</button>
        <button className="btn">Submit</button>
      </div>
    </div>
  )
}