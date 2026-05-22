"use client";

import { useState } from "react";
import {
  BrainIcon,
  ImageIcon,
  MirrorIcon,
  PlusIcon,
  SpeakerIcon,
  UserIcon,
  XTreeIcon,
} from "@/components/icons";
import InterestChip from "./interest-chip";

const predefinedInterests = [
  {
    title: "Reflect on past memories",
    Icon: BrainIcon,
  },
  {
    title: "Learn more about myself",
    Icon: UserIcon,
  },
  {
    title: "Create my digital clone",
    Icon: MirrorIcon,
  },
  {
    title: "Tell my own story",
    Icon: SpeakerIcon,
  },
  {
    title: "Build my legacy",
    Icon: XTreeIcon,
  },
  {
    title: "Preserve family memories",
    Icon: ImageIcon,
  },
];

interface ReasonsSelectorProps {
  selected: string[];
  onToggle: (reason: string) => void;
  onAdd: (reason: string) => void;
}

export default function ReasonsSelector({
  selected,
  onToggle,
  onAdd,
}: ReasonsSelectorProps) {
  const [addingCustom, setAddingCustom] = useState(false);
  const [customReason, setCustomReason] = useState("");

  const handleAdd = () => {
    const trimmed = customReason.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setCustomReason("");
    setAddingCustom(false);
  };

  return (
    <ul className="flex flex-wrap gap-3">
      {predefinedInterests.map((interest) => (
        <InterestChip
          key={interest.title}
          title={interest.title}
          Icon={interest.Icon}
          isSelected={selected.includes(interest.title)}
          onClick={() => onToggle(interest.title)}
        />
      ))}

      {selected
        .filter(
          (reason) => !predefinedInterests.some((interest) => interest.title === reason),
        )
        .map((reason, index) => (
          <InterestChip
            key={`custom-${index}`}
            title={reason}
            isSelected
            onClick={() => onToggle(reason)}
          />
        ))}

      {addingCustom ? (
        <li className="flex w-fit items-center gap-2 rounded-lg border border-gray-200 py-2.5 px-3">
          <input
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder="Type a reason"
            className="bg-transparent text-base font-inter text-gray-900 placeholder:text-gray-500 outline-none"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAdd}
              className="text-sm font-inter text-blue-7"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setAddingCustom(false);
                setCustomReason("");
              }}
              className="text-sm font-inter text-gray-500"
            >
              Cancel
            </button>
          </div>
        </li>
      ) : (
        <InterestChip
          title="Add more reasons"
          Icon={PlusIcon}
          className="!border-dashed border-gray-500"
          onClick={() => setAddingCustom(true)}
        />
      )}
    </ul>
  );
}

