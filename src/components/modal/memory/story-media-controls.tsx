import { useRef, useState, type ChangeEvent } from "react";
import type { Editor } from "@tiptap/core";
import Picker from "@emoji-mart/react";
import emojiData from "@emoji-mart/data";
import { ImageIcon, Mic, Music, Paperclip, Plus, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useModal } from "@/hooks/use-modal";
import {
  MEMORY_ACCEPT_AUDIO,
  MEMORY_ACCEPT_DOCUMENTS,
  MEMORY_ACCEPT_IMAGES,
  MEMORY_ACCEPT_VIDEOS,
} from "@/utility/constant";

export function StoryMediaControls({
  editor,
  onUpload,
  disabled,
}: {
  editor: Editor | null;
  onUpload: (file: File, duration?: number) => void;
  disabled: boolean;
}) {
  const { push } = useModal();
  const [showEmoji, setShowEmoji] = useState(false);
  const recordingNumber = useRef(1);
  const photos = useRef<HTMLInputElement>(null);
  const videos = useRef<HTMLInputElement>(null);
  const audio = useRef<HTMLInputElement>(null);
  const documents = useRef<HTMLInputElement>(null);
  const selectFiles = (event: ChangeEvent<HTMLInputElement>) => {
    for (const file of Array.from(event.target.files ?? [])) onUpload(file);
    event.target.value = "";
  };
  const controlClass =
    "size-9 rounded-[10px] text-icon-neutral-strong hover:bg-fill-neutral-weak";

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      <input
        ref={photos}
        type="file"
        multiple
        accept={MEMORY_ACCEPT_IMAGES}
        onChange={selectFiles}
        aria-label="Upload photos"
        className="hidden"
        disabled={disabled}
      />
      <input
        ref={videos}
        type="file"
        multiple
        accept={MEMORY_ACCEPT_VIDEOS}
        onChange={selectFiles}
        aria-label="Upload videos"
        className="hidden"
        disabled={disabled}
      />
      <input
        ref={audio}
        type="file"
        multiple
        accept={MEMORY_ACCEPT_AUDIO}
        onChange={selectFiles}
        aria-label="Upload audio"
        className="hidden"
        disabled={disabled}
      />
      <input
        ref={documents}
        type="file"
        multiple
        accept={MEMORY_ACCEPT_DOCUMENTS}
        onChange={selectFiles}
        aria-label="Upload documents"
        className="hidden"
        disabled={disabled}
      />
      <DropdownMenu
        modal={false}
        onOpenChange={(open) => {
          if (open) setShowEmoji(false);
        }}
      >
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="icon"
            disabled={disabled}
            className="size-9 rounded-[10px] bg-fill-neutral-strong text-text-inverse-strong hover:bg-fill-neutral-strong/90"
            aria-label="Add attachment"
            title="Add attachment"
          >
            <Plus className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="start"
          onEscapeKeyDown={(event) => event.stopPropagation()}
          className="z-[220]"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel>Choose upload type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => photos.current?.click()}>
              <ImageIcon />
              Photos
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => videos.current?.click()}>
              <Video />
              Videos
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => audio.current?.click()}>
              <Music />
              Audio
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => documents.current?.click()}>
              <Paperclip />
              Documents
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Popover open={showEmoji} onOpenChange={setShowEmoji}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            className={controlClass}
            aria-label="Insert emoji"
            title="Insert emoji"
          >
            <span aria-hidden className="text-lg leading-none">
              🙂
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="start"
          sideOffset={12}
          onEscapeKeyDown={(event) => event.stopPropagation()}
          className="z-[220] w-auto overflow-hidden border-stroke-neutral-weak p-0 shadow-lg"
        >
          <Picker
            data={emojiData}
            onEmojiSelect={(emoji: { native: string }) => {
              editor?.chain().focus().insertContent(emoji.native).run();
              setShowEmoji(false);
            }}
            theme="light"
            previewPosition="none"
          />
        </PopoverContent>
      </Popover>
      <Separator
        orientation="vertical"
        className="h-5 bg-stroke-neutral-weak"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled}
        className={controlClass}
        aria-label="Record audio"
        title="Record audio"
        onClick={() =>
          push?.("audio-recorder", {
            onFinish: (file: File, duration?: number) => {
              onUpload(file, duration);
              recordingNumber.current += 1;
            },
            recordingNumber: recordingNumber.current,
          })
        }
      >
        <Mic className="size-5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled}
        className={controlClass}
        aria-label="Record video"
        title="Record video"
        onClick={() => push?.("video-recorder", { onFinish: onUpload })}
      >
        <Video className="size-5" />
      </Button>
    </div>
  );
}
