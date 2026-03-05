"use client";

import { useState } from "react";
import { AutogenerateTagsButton } from "@/components/Buttons";

interface TagsFieldProps {
  tags: string[];
  setTags: React.Dispatch<React.SetStateAction<string[]>>;
  title: string;
  body: string;
}

export function TagsField({ tags, setTags, title, body }: TagsFieldProps) {
  const [tagInput, setTagInput] = useState("");

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  };

  return (
    <div>
      <p className="font-inter text-sm font-medium text-gray-700 mb-2">Tags</p>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((t) => (
            <span
              key={t}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200 font-inter text-xs text-gray-700"
            >
              {t}
              <button
                type="button"
                onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
                className="opacity-60 hover:opacity-100 leading-none ml-0.5"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag(tagInput);
            }
          }}
          placeholder="Manually add tags or click to autogenerate"
          className="flex-1 outline-none font-inter text-sm text-gray-500 placeholder:text-gray-400 px-4 py-3"
        />
        <AutogenerateTagsButton
          title={title}
          body={body}
          onTagsGenerated={(newTags) => setTags((prev) => [...new Set([...prev, ...newTags])])}
        />
      </div>
    </div>
  );
}
