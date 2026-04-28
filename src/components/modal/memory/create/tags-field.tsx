"use client";

import { useState } from "react";
import { AutogenerateTagsButton } from "@/components/Buttons";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
      <Label htmlFor="create-memory-tags" className="font-inter font-medium text-text-neutral-strong mb-2">
        Tags
      </Label>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((t) => (
            <span
              key={t}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-full border font-inter text-xs",
                "bg-fill-neutral-weak border-stroke-neutral-weak text-text-neutral-strong",
              )}
            >
              {t}
              <button
                type="button"
                onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
                className="opacity-60 hover:opacity-100 leading-none ml-0.5 text-text-neutral-weak hover:text-text-neutral-strong"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <InputGroup
        className={cn(
          "h-auto min-h-12 rounded-xl border-stroke-neutral-weak bg-v3-bg",
          /* shadow-none removes box-shadow and hides the group focus ring */
          "has-[[data-slot=input-group-control]:focus-visible]:ring-inset",
        )}
      >
        <InputGroupInput
          id="create-memory-tags"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag(tagInput);
            }
          }}
          placeholder="Manually add tags or click to autogenerate"
          className="min-h-12 py-3 px-4 font-inter md:text-sm text-text-neutral-strong placeholder:text-neutral-weak"
        />
        <InputGroupAddon align="inline-end" className="pr-2">
          <AutogenerateTagsButton
            title={title}
            body={body}
            onTagsGenerated={(newTags) => setTags((prev) => [...new Set([...prev, ...newTags])])}
          />
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
