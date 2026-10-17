import { ConnectionSettingsDialog } from "./connection-settings";
import { Settings2 } from "lucide-react";
import { TalkWorkspace } from "./talk-workspace";
import { ContributionDialog } from "./contribution-dialog";
import { mutate } from "swr";
import { isSpaceKey } from "@/api/people";
import { useState } from "react";
import { ArrowLeft, BookOpen, LockKeyhole, MessageCircle } from "lucide-react";
import type { Person } from "@/api/people";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { OurSpace } from "./our-space";

export function RelationshipWorkspace({
  person,
  onBack,
}: {
  person: Person;
  onBack: () => void;
}) {
  const [talkSource, setTalkSource] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [tab, setTab] = useState("space");
  const [settings, setSettings] = useState(false);
  const [adding, setAdding] = useState(false);
  return (
    <div className="people-workspace flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-stroke-neutral-weak bg-bg-neutral">
      {adding && (
        <ContributionDialog
          person={person}
          onClose={() => setAdding(false)}
          onSaved={() => { void mutate(isSpaceKey).catch(() => undefined); }}
        />
      )}
      {settings && (
        <ConnectionSettingsDialog
          person={person}
          onClose={() => setSettings(false)}
        />
      )}
      <header className="flex items-center gap-3 border-b border-stroke-neutral-weak px-5 py-5 sm:px-9">
        <Button
          variant="ghost"
          size="icon"
          className="people-control md:hidden"
          aria-label="Back to people"
          onClick={onBack}
        >
          <ArrowLeft aria-hidden />
        </Button>
        <Avatar size="lg">
          <AvatarImage src={person.avatar_url || undefined} alt="" />
          <AvatarFallback>{person.name.slice(0, 1)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-garamond text-2xl font-medium text-text-neutral-strong">
            {person.name}
          </h2>
          <p className="truncate text-xs text-text-neutral-weak">
            {person.relationship || "Connection"}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-stroke-neutral-weak bg-bg-neutral-weaker px-2.5 py-1.5 text-xs text-text-neutral-weak">
          <LockKeyhole
            className="size-3.5 text-icon-neutral-weaker"
            aria-hidden
          />
          <span className="hidden sm:inline">
            {person.memento_state === "active"
              ? "Memento active"
              : person.memento_state === "ready"
                ? "Memento not active"
                : "Memento private"}
          </span>
          <span className="sm:hidden">
            {person.memento_state === "active" ? "Active" : "Private"}
          </span>
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="people-control"
          aria-label="Connection settings"
          onClick={() => setSettings(true)}
        >
          <Settings2 aria-hidden />
        </Button>
      </header>
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(String(value))}
        className="people-tabs min-h-0 flex-1 flex-col gap-0"
      >
        <div className="border-b border-stroke-neutral-weak px-5 sm:px-9">
          <TabsList
            variant="line"
            aria-label="Relationship workspace"
            className="h-12"
          >
            <TabsTrigger value="talk" className="people-control px-4">
              <MessageCircle aria-hidden />
              Talk
            </TabsTrigger>
            <TabsTrigger value="space" className="people-control px-4">
              <BookOpen aria-hidden />
              Our Space
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent
          value="space"
          className="min-h-0 overflow-y-auto bg-bg-neutral-weaker"
        >
          <OurSpace
            person={person}
            onTalk={(id, title) => {
              setTalkSource({ id, title });
              setTab("talk");
            }}
          />
        </TabsContent>
        <TabsContent
          value="talk"
          className="flex min-h-0 flex-col overflow-y-auto bg-bg-neutral-weaker"
        >
          {person.memento_state === "active" ? (
            <TalkWorkspace
              person={person}
              source={talkSource}
              onSourceUsed={() => setTalkSource(null)}
            />
          ) : (
            <Empty className="min-h-80 gap-6 px-6 py-12">
              <EmptyHeader>
                <EmptyTitle className="text-3xl">
                  {person.name}’s Memento is private.
                </EmptyTitle>
                <EmptyDescription>
                  You can still keep memories together in Our Space.
                </EmptyDescription>
              </EmptyHeader>
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  size="form"
                  className="people-control"
                  onClick={() => setAdding(true)}
                >
                  Add a memory
                </Button>
                <Button
                  size="form"
                  className="people-control"
                  variant="outline"
                  onClick={() => setTab("space")}
                >
                  Our Space
                </Button>
              </div>
            </Empty>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
