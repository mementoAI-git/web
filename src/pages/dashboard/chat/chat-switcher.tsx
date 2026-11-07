import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useSWR from "swr";
import { ChevronDown } from "lucide-react";
import {
  getPeople,
  getConnectionSettings,
  PEOPLE_ENDPOINT,
  type Person,
} from "@/api/people";
import { useStore } from "@/hooks/use-store";
import { useModal } from "@/hooks/use-modal";
import { useVoiceSession } from "@/contexts/voice-session";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { ChatDesignIcon } from "@/components/chat-design-icon";
import { getProfileAvatarUrl } from "@/utility/profile-avatar";
import { FormDialogContent } from "@/components/modal/form-dialog";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import GroupManagement from "@/components/modal/settings/beneficiary&group/group";
import { useFeatureFlags } from "@/contexts/feature-flags";
import { useSubscription } from "@/contexts/subscription";
import { UpgradePrompt } from "@/features/pricing/upgrade-prompt";
import { SETTINGS_BENEFICIARIES_SWR_KEY } from "@/components/modal/settings/beneficiary&group/beneficiaries-list-swr-key";
import { ActivationDialog } from "../people/activation-dialog";
import {
  BlockedPeopleDialog,
  ConnectionSettingsDialog,
} from "../people/connection-settings";
import "../people/people-motion.css";

export function ConnectionSummary({ person }: { person: Person }) {
  const { user } = useStore();
  const { data } = useSWR(
    ["people-settings", user?._id, person.user_id],
    () => getConnectionSettings(person.user_id),
    { refreshInterval: 15000 },
  );
  return (
    <>
      {person.relationship || "Connection"}
      {data
        ? ` • ${data.shared_item_count} ${data.shared_item_count === 1 ? "memory" : "memories"}`
        : ""}
    </>
  );
}

export function ChatSwitcher({ children }: { children?: ReactNode }) {
  const { user } = useStore();
  const { canUse } = useFeatureFlags();
  const { isProOrAbove } = useSubscription();
  const [limitOpen, setLimitOpen] = useState(false);
  const {
    data: recipientCount,
    error: countError,
    mutate: retryCount,
  } = useSWR<{ data?: { totalDocs?: number; docs?: unknown[] } }>(
    user?._id ? SETTINGS_BENEFICIARIES_SWR_KEY : null,
  );
  const atLimit =
    !isProOrAbove &&
    (recipientCount?.data?.totalDocs ??
      recipientCount?.data?.docs?.length ??
      0) >= 2;
  const { open: openModal, state: externalModals } = useModal();
  const voice = useVoiceSession();
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const selected = params.get("person");
  const peopleRequested = params.get("people") === "1";
  const [open, setOpen] = useState(peopleRequested);
  // Voice "show my people" navigates here while chat may already be open.
  useEffect(() => {
    if (peopleRequested) setOpen(true);
  }, [peopleRequested, location.key]);
  const [access, setAccess] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [section, setSection] = useState("people");
  const [removeOnOpen, setRemoveOnOpen] = useState(false);
  const [editing, setEditing] = useState<Person | null>(null);
  const { data, error, isLoading, mutate } = useSWR(
    user?._id ? [PEOPLE_ENDPOINT, user._id] : null,
    getPeople,
    { refreshInterval: 15000 },
  );
  const select = (id?: string) => {
    voice?.end();
    const next = new URLSearchParams(location.search);
    ["person", "people", "voice", "starter", "details"].forEach((key) =>
      next.delete(key),
    );
    if (id) next.set("person", id);
    navigate({
      pathname: location.pathname,
      search: next.size ? `?${next}` : "",
    });
    setOpen(false);
  };
  const edit = (person: Person, remove = false) => {
    setRemoveOnOpen(remove);
    setOpen(false);
    setEditing(person);
  };
  const selectedPerson = data?.connections.find(
    (person) => person.user_id === selected,
  );
  const personalName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    "My Memento";
  const selectedName = selected
    ? selectedPerson?.name || "Loading Memento…"
    : personalName;
  const rowLayout =
    "flex min-h-[72px] w-full items-start gap-4 rounded-2xl p-3 text-left font-sans";
  const row = `${rowLayout} people-control hover:bg-fill-neutral-weak aria-[current=true]:bg-fill-neutral-weak focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring`;
  const menuTrigger =
    "people-control absolute right-2 top-2 size-8 rounded-full text-icon-neutral-strong";
  return (
    <>
      <Dialog open={open && !externalModals?.length} onOpenChange={setOpen}>
        {children ? (
          <DialogTrigger asChild>{children}</DialogTrigger>
        ) : (
          <div className="people-control flex h-10 min-w-0 max-w-full items-center rounded-full border border-stroke-neutral-weak bg-fill-neutral-weak">
            <button
              type="button"
              data-connection-details={selected || undefined}
              aria-label={selected ? `About ${selectedName}` : "My Memento"}
              onClick={() => {
                if (!selected) {
                  setOpen(true);
                  return;
                }
                const next = new URLSearchParams(location.search);
                next.set("details", "1");
                navigate(
                  { pathname: location.pathname, search: `?${next}` },
                  { replace: true },
                );
              }}
              className="flex h-full min-w-0 items-center gap-2 rounded-l-full pl-1 pr-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
            >
              <UserAvatar
                alt=""
                size="md"
                userId={selected || user?._id}
                name={selectedName}
                src={
                  selected
                    ? selectedPerson?.avatar_url
                    : getProfileAvatarUrl(user)
                }
              />
              <span className="min-w-0 max-[359px]:sr-only">
                <span className="block truncate text-sm font-medium leading-4">
                  {selectedName}
                </span>
                <span className="block truncate text-xs leading-4 text-text-neutral-weaker">
                  {selectedPerson ? (
                    <ConnectionSummary person={selectedPerson} />
                  ) : selected ? (
                    "Connection"
                  ) : (
                    "My Memento"
                  )}
                </span>
              </span>
            </button>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Change Memento"
                aria-description={`Current Memento: ${selectedName}`}
                className="size-9 shrink-0 rounded-full"
              >
                <ChevronDown className="size-4" aria-hidden />
              </Button>
            </DialogTrigger>
          </div>
        )}
        <FormDialogContent className="people-dialog grid max-h-[85dvh] gap-6 bg-bg-raised">
          <DialogHeader className="flex-row items-center justify-between gap-4">
            <DialogTitle className="font-sans text-2xl font-bold leading-8">
              Chat spaces
            </DialogTitle>
            <Button
              className="h-8 rounded-full px-5 font-sans text-sm font-medium"
              disabled={
                section === "groups"
                  ? !canUse("group.create")
                  : !canUse("beneficiary.create") ||
                    (!isProOrAbove && !recipientCount)
              }
              onClick={() => {
                if (section === "groups") openModal("add-group");
                else if (atLimit) setLimitOpen(true);
                else openModal("add-beneficiary", { mode: "connection" });
              }}
            >
              {section === "groups" ? "Create group" : "Invite people"}
            </Button>
            <DialogDescription className="sr-only">
              Choose the Memento you want to talk with.
            </DialogDescription>
          </DialogHeader>
          {countError && section === "people" && (
            <Button variant="outline" onClick={() => void retryCount()}>
              Retry invitation availability
            </Button>
          )}
          <div className="space-y-1">
            <div className="relative">
              <button
                className={row}
                onClick={() => select()}
                aria-current={!selected ? "true" : undefined}
              >
                <UserAvatar
                  alt=""
                  size="lg"
                  className="data-[size=lg]:size-12"
                  userId={user?._id}
                  name="My Memento"
                  src={getProfileAvatarUrl(user)}
                />
                <span className="min-w-0 flex-1 pr-8">
                  <span className="block truncate text-base font-medium leading-6">
                    My Memento
                  </span>
                  <span className="block text-sm leading-5 text-text-neutral-weaker">
                    Your personal conversation
                  </span>
                </span>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={menuTrigger}
                    aria-label="My Memento options"
                  >
                    <ChatDesignIcon name="more" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="people-menu">
                  <DropdownMenuItem
                    onSelect={() => {
                      setOpen(false);
                      setAccess(true);
                    }}
                  >
                    Memento access
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      setOpen(false);
                      setBlocked(true);
                    }}
                  >
                    Blocked people
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Tabs
              value={section}
              onValueChange={(value) => setSection(String(value))}
              className="flex-col pt-3"
            >
              <TabsList
                className="h-10 w-full shrink-0 bg-fill-neutral-weak"
                aria-label="Connections"
              >
                <TabsTrigger
                  value="people"
                  className="people-control h-8 data-[active]:!bg-bg-raised data-[active]:!text-text-neutral-strong motion-reduce:transition-none"
                >
                  People
                </TabsTrigger>
                <TabsTrigger
                  value="groups"
                  className="people-control h-8 data-[active]:!bg-bg-raised data-[active]:!text-text-neutral-strong motion-reduce:transition-none"
                >
                  Groups
                </TabsTrigger>
              </TabsList>
              <TabsContent value="people" className="space-y-1">
                {isLoading ? (
                  <p role="status" className="p-3">
                    Loading your people…
                  </p>
                ) : error ? (
                  <Button variant="outline" onClick={() => void mutate()}>
                    Retry loading people
                  </Button>
                ) : (
                  data?.connections.map((person) => (
                    <div className="relative" key={person.user_id}>
                      <button
                        className={row}
                        onClick={() => select(person.user_id)}
                        aria-current={
                          selected === person.user_id ? "true" : undefined
                        }
                      >
                        <UserAvatar
                          alt=""
                          size="lg"
                          className="data-[size=lg]:size-12"
                          userId={person.user_id}
                          name={person.name}
                          src={person.avatar_url}
                        />
                        <span className="min-w-0 flex-1 pr-8">
                          <span className="block truncate text-base font-medium leading-6">
                            {person.name}
                          </span>
                          <span className="block truncate text-sm leading-5 text-text-neutral-weaker">
                            <ConnectionSummary person={person} />
                          </span>
                          <span className="sr-only">
                            {person.memento_state === "active"
                              ? "Memento active"
                              : person.memento_state === "ready"
                                ? "Ready to activate"
                                : "Memento private"}
                          </span>
                        </span>
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={menuTrigger}
                            aria-label={`Options for ${person.name}`}
                          >
                            <ChatDesignIcon name="more" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="people-menu"
                        >
                          <DropdownMenuItem
                            onSelect={() => select(person.user_id)}
                          >
                            Open chat
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => edit(person)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => edit(person, true)}>
                            Remove connection
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))
                )}
                {data?.pending.map((invite) => (
                  <div className="relative" key={invite.invite_id}>
                    <div className={rowLayout}>
                      <UserAvatar
                        alt=""
                        size="lg"
                        className="data-[size=lg]:size-12"
                        email={invite.email}
                        name={invite.name}
                      />
                      <span className="min-w-0 flex-1 pr-8">
                        <span className="block truncate text-base font-medium leading-6">
                          {invite.name}
                        </span>
                        <span className="flex min-w-0 items-center gap-2 text-sm leading-5 text-text-neutral-weaker">
                          <span className="truncate">
                            {invite.relationship || "Connection"}
                          </span>
                          <span aria-hidden="true">•</span>
                          <span className="shrink-0 text-xs text-text-neutral-weak">
                            Pending
                          </span>
                        </span>
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={menuTrigger}
                          aria-label={`Options for ${invite.name}`}
                        >
                          <ChatDesignIcon name="more" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="people-menu">
                        <DropdownMenuItem
                          onSelect={() =>
                            openModal("resend-invite", {
                              email: invite.email,
                              mode: "connection",
                            })
                          }
                        >
                          Resend invite
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            openModal("delete-beneficiary", {
                              id: invite.invite_id,
                              mode: "connection",
                            })
                          }
                        >
                          Cancel invite
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="groups">
                <GroupManagement compact />
              </TabsContent>
            </Tabs>
          </div>
          <DialogClose asChild>
            <button className="sr-only focus:not-sr-only focus:rounded-lg focus:p-2">
              Close Chat spaces
            </button>
          </DialogClose>
        </FormDialogContent>
      </Dialog>
      <UpgradePrompt
        feature="beneficiaries"
        variant="modal"
        open={limitOpen}
        onOpenChange={setLimitOpen}
      />
      {access && (
        <ActivationDialog
          onClose={() => {
            setAccess(false);
            setOpen(true);
          }}
        />
      )}
      {blocked && (
        <BlockedPeopleDialog
          onClose={() => {
            setBlocked(false);
            setOpen(true);
          }}
        />
      )}
      {editing && (
        <ConnectionSettingsDialog
          person={editing}
          initialAction={removeOnOpen ? "remove" : undefined}
          onClose={() => {
            setEditing(null);
            setOpen(true);
          }}
        />
      )}
    </>
  );
}
