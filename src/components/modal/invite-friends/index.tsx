import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { Check, Copy, Link2, UserRoundCheck } from "lucide-react";
import { toast } from "sonner";
import endpoint from "@/api/endpoint";
import { get } from "@/api/mutations";
import { useStore } from "@/hooks/use-store";
import { useModal } from "@/hooks/use-modal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";

interface InviteDetails {
  invite_url: string;
  signup_count: number;
}
async function fetchInviteDetails(): Promise<InviteDetails> {
  const result = await get<InviteDetails>(endpoint.referrals);
  const value = result.data;
  if (
    result.success === false ||
    !value ||
    !Number.isSafeInteger(value.signup_count) ||
    value.signup_count < 0 ||
    typeof value.invite_url !== "string"
  )
    throw new Error("Invite details unavailable");
  const url = new URL(value.invite_url);
  if (!["https:", "http:"].includes(url.protocol))
    throw new Error("Invalid invite link");
  return value;
}

export function InviteFriends() {
  const { user } = useStore();
  const { close } = useModal();
  const { data, error, isLoading, mutate } = useSWR(
    user?._id ? [endpoint.referrals, user._id] : null,
    fetchInviteDetails,
  );
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const returnFocusRef = useRef(document.activeElement as HTMLElement | null);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);
  const copyLink = async () => {
    if (!data || copying) return;
    setCopying(true);
    try {
      await navigator.clipboard.writeText(data.invite_url);
      setCopied(true);
    } catch {
      inputRef.current?.focus();
      inputRef.current?.select();
      toast.error("Couldn’t copy the link. Select it and copy manually.");
    } finally {
      setCopying(false);
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close("invite-friends");
      }}
    >
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[480px] motion-reduce:animate-none"
        overlayClassName="bg-overlay-backdrop"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocusRef.current?.focus();
        }}
      >
        <DialogHeader className="items-center pt-2 text-center">
          <span aria-hidden className="mb-2 text-[40px] leading-none">
            🫂
          </span>
          <DialogTitle className="font-garamond text-[32px] font-medium leading-10">
            Invite friends
          </DialogTitle>
          <DialogDescription className="max-w-[340px] text-center leading-6">
            Invite your friends to Memento. Give them a space for their stories,
            memories, and reflections.
          </DialogDescription>
        </DialogHeader>
        <Card className="gap-3 py-5 shadow-none">
          <CardHeader className="gap-1 text-center">
            <CardTitle className="text-sm">Friends who joined</CardTitle>
            <CardDescription>
              Signups through your personal link
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-2">
            {isLoading || !user?._id ? (
              <Skeleton
                className="h-12 w-16"
                aria-label="Loading signup count"
              />
            ) : error ? (
              <div className="flex flex-col items-center gap-2">
                <p role="alert" className="text-sm text-text-error-strong">
                  We couldn’t load your invite details.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void mutate()}
                >
                  Try again
                </Button>
              </div>
            ) : (
              <>
                <p
                  aria-label={`${data?.signup_count ?? 0} friends joined`}
                  className="text-[40px] font-medium leading-12 tabular-nums"
                >
                  {data?.signup_count}
                </p>
                <p className="text-xs text-muted-foreground">
                  {data?.signup_count === 0
                    ? "Your first invite starts here."
                    : "Thanks for bringing your friends along."}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Field>
          <FieldLabel htmlFor="friend-invite-link">Your invite link</FieldLabel>
          {isLoading || !user?._id ? (
            <Skeleton
              className="h-12 w-full"
              aria-label="Loading invite link"
            />
          ) : (
            <InputGroup className="h-12">
              <InputGroupInput
                ref={inputRef}
                id="friend-invite-link"
                readOnly
                value={error ? "" : (data?.invite_url ?? "")}
                placeholder="Invite link unavailable"
                onFocus={(event) => event.currentTarget.select()}
              />
              <InputGroupAddon align="inline-end" className="py-0 pr-0.5">
                <InputGroupButton
                  size="sm"
                  variant="default"
                  className="h-11 min-w-[92px] active:scale-[0.97] motion-reduce:transform-none"
                  disabled={!data || !!error || copying}
                  onClick={() => void copyLink()}
                >
                  {copied ? (
                    <Check data-icon="inline-start" />
                  ) : (
                    <Copy data-icon="inline-start" />
                  )}
                  <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          )}
        </Field>
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium">How it works</h3>
          <p className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
            <Link2 className="mt-1 size-4 shrink-0" aria-hidden />
            Share your link with a friend.
          </p>
          <p className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
            <UserRoundCheck className="mt-1 size-4 shrink-0" aria-hidden />
            When they create an account, your count goes up.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
