import { useRequestRecovery } from "@/hooks/use-request-recovery";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import endpoint from "@/api/endpoint";
import { get } from "@/api/mutations";
import { useStore } from "@/hooks/use-store";
import { useModal } from "@/hooks/use-modal";
import { Button } from "@/components/ui/button";
import { InviteDialog } from "../invite-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
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
  const retry = useRequestRecovery(
    `invite:${user?._id}`,
    error,
    mutate,
    "Couldn’t load your invite details. Please retry.",
  );
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const copyRef = useRef<HTMLButtonElement>(null);
  const canCopy = Boolean(data) && !error;
  // Copy starts disabled while the link loads; hand it focus once it's ready, unless the user moved on.
  useEffect(() => {
    if (!canCopy) return;
    const active = document.activeElement;
    if (active?.getAttribute("role") === "dialog") copyRef.current?.focus();
  }, [canCopy]);
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
    <InviteDialog
      title="Invite friends"
      description="Bring your people along."
      onClose={() => close("invite-friends")}
      initialFocusRef={copyRef}
    >
      <div className="flex items-center gap-2 rounded-2xl border border-stroke-neutral-weak bg-fill-neutral-weaker px-3 py-2">
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center text-2xl leading-none"
        >
          🔗
        </span>
        <Field className="min-w-0 flex-1 gap-0">
          {isLoading || !user?._id ? (
            <Skeleton className="h-6 w-full" aria-label="Loading invite link" />
          ) : (
            <InputGroup className="h-6 rounded-none border-0 bg-transparent shadow-none focus-within:ring-0">
              <InputGroupInput
                ref={inputRef}
                id="friend-invite-link"
                aria-label="Your invite link"
                readOnly
                className="h-6 min-w-0 px-0 text-xs text-text-neutral-weak"
                value={error ? "" : (data?.invite_url ?? "")}
                placeholder="Invite link unavailable"
                onFocus={(event) => event.currentTarget.select()}
              />
            </InputGroup>
          )}
        </Field>
        <Button
          ref={copyRef}
          size="sm"
          className="min-w-[72px] shrink-0 px-2.5 text-xs active:scale-[0.97] motion-reduce:transform-none"
          disabled={!data || !!error || copying}
          onClick={() => void copyLink()}
        >
          {copied ? (
            <Check className="size-3.5" />
          ) : (
            <Copy className="size-3.5" />
          )}
          <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
        </Button>
      </div>
      <Card className="gap-2 bg-fill-lime-weak py-3 shadow-none">
        <CardHeader className="gap-1 text-center">
          <CardDescription>Signups through your link</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-2">
          {isLoading || !user?._id ? (
            <Skeleton className="h-10 w-16" aria-label="Loading signup count" />
          ) : error ? (
            <div className="flex flex-col items-center gap-2">
              <Button variant="outline" size="sm" onClick={retry}>
                Try again
              </Button>
            </div>
          ) : (
            <p
              aria-label={`${data?.signup_count ?? 0} friends joined`}
              className="text-[32px] font-medium leading-10 tabular-nums"
            >
              {data?.signup_count}
            </p>
          )}
        </CardContent>
      </Card>
    </InviteDialog>
  );
}
