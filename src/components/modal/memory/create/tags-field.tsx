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
  variant?: "default" | "panel";
}

export function TagsField({
  tags,
  setTags,
  title,
  body,
  variant = "default",
}: TagsFieldProps) {
  const [tagInput, setTagInput] = useState("");

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  };

  if (variant === "panel") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Label
            htmlFor="create-memory-tags-panel"
            className="font-geist text-base font-semibold text-[rgba(15,7,0,0.9)]"
          >
            Add Tags
          </Label>
          <AutogenerateTagsButton
            title={title}
            body={body}
            onTagsGenerated={(newTags) =>
              setTags((prev) => {
                const seen = new Set(prev.map((t) => t.toLowerCase()));
                const next = [...prev];
                for (const raw of newTags) {
                  const t = raw.trim();
                  if (!t) continue;
                  const key = t.toLowerCase();
                  if (!seen.has(key)) {
                    seen.add(key);
                    next.push(t);
                  }
                }
                return next;
              })
            }
            label="Auto tag"
            className="h-[25px] rounded-full border border-[rgba(26,128,247,0.2)] bg-[rgba(26,128,247,0.06)] px-2.5 font-geist text-xs font-bold text-[#1a80f7] hover:bg-[rgba(26,128,247,0.12)]"
          />
        </div>
        <div className="rounded-[8px] border border-[rgba(15,7,0,0.1)] bg-[rgba(15,7,0,0.02)] px-3 py-2.5">
          <input
            id="create-memory-tags-panel"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag(tagInput);
              }
            }}
            placeholder="Manually add tags or click to autogenerate"
            className="h-5 w-full border-0 bg-transparent p-0 font-geist text-sm leading-5 text-[rgba(15,7,0,0.9)] outline-none placeholder:text-[rgba(15,7,0,0.45)]"
          />
        </div>
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t, index) => {
              const chipStyles = [
                "border-[#cfe0ff] bg-[rgba(26,128,247,0.06)] text-[#1a80f7]",
                "border-[#fcceee] bg-[#fdf2fa] text-[#c11574]",
                "border-[#d9d6fe] bg-[#f4f3ff] text-[#5925dc]",
                "border-[#f9dbaf] bg-[#fef6ee] text-[#b93815]",
              ];
              return (
                <span
                  key={t}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-inter text-xs font-medium leading-[18px]",
                    chipStyles[index % chipStyles.length],
                  )}
                >
                  {t.startsWith("#") ? t : `#${t}`}
                  <button
                    type="button"
                    onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
                    className="leading-none opacity-60 transition-opacity hover:opacity-100"
                    aria-label={`Remove ${t}`}
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  }

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
            onTagsGenerated={(newTags) =>
              setTags((prev) => {
                const seen = new Set(prev.map((t) => t.toLowerCase()));
                const next = [...prev];
                for (const raw of newTags) {
                  const t = raw.trim();
                  if (!t) continue;
                  const key = t.toLowerCase();
                  if (!seen.has(key)) {
                    seen.add(key);
                    next.push(t);
                  }
                }
                return next;
              })
            }
          />
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
