"use client";

import { useState } from "react";
import IntrestChip from "./intrest-chip";
import PlusIcon from "@/public/icon/plus.svg";
import ReflectIcon from "@/public/icon/reason/brain.svg";
import LearnIcon from "@/public/icon/reason/user.svg";
import CreateIcon from "@/public/icon/reason/mirror.svg";
import TellIcon from "@/public/icon/reason/speaker.svg";
import BuildIcon from "@/public/icon/reason/x-tree.svg";
import PreserveIcon from "@/public/icon/reason/image.svg";

const predefinedInterests = [
  {
    title: "Reflect on past memories",
    icon: ReflectIcon
  },
  {
    title: "Learn more about myself",
    icon: LearnIcon
  },
  {
    title: "Create my digital clone",
    icon: CreateIcon
  },
  {
    title: "Tell my own story",
    icon: TellIcon
  },
  {
    title: "Build my legacy",
    icon: BuildIcon
  },
  {
    title: "Preserve family memories",
    icon: PreserveIcon
  }
]

interface ReasonsSelectorProps {
  selected: string[];
  onToggle: (reason: string) => void;
  onAdd: (reason: string) => void;
}

export default function ReasonsSelector({ selected, onToggle, onAdd }: ReasonsSelectorProps) {
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
    <ul className="flex gap-3 flex-wrap">
      {predefinedInterests.map((interest, i) => (
        <IntrestChip
          key={i}
          title={interest.title}
          Icon={interest.icon}
          isSelected={selected.includes(interest.title)}
          onClick={() => onToggle(interest.title)}
        />
      ))}

      {
        selected
          .filter((reason) => !predefinedInterests.some(interest => interest.title === reason))
          .map((reason, i) => (
            <IntrestChip
              key={`custom-${i}`}
              title={reason}
              isSelected
              onClick={() => onToggle(reason)}
            />
          ))
      }

      {
        addingCustom ? (
          <li className="border border-gray-200 flex gap-2 w-fit items-center rounded-lg py-2.5 px-3">
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
              className="outline-none text-base font-inter text-gray-900 placeholder:text-gray-500 bg-transparent"
            />
            <div className="flex items-center gap-2">
              <button type="button" onClick={handleAdd} className="text-blue-7 font-inter text-sm">Add</button>
              <button type="button" onClick={() => { setAddingCustom(false); setCustomReason("") }} className="text-gray-500 font-inter text-sm">Cancel</button>
            </div>
          </li>
        ) : (
          <IntrestChip
            title="Add more reasons"
            Icon={PlusIcon}
            className="!border-dashed border-gray-500"
            onClick={() => setAddingCustom(true)}
          />
        )}
    </ul>
  );
}


