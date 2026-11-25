import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { z } from "zod";

import {
  browseSampleMemories,
  connectMemento,
  disconnectMemento,
  getSandboxStatus,
} from "@/app/sandbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

import { MemorySources } from "./memory-sources";

type SandboxStatus = Awaited<ReturnType<typeof getSandboxStatus>>;
type SampleSources = Awaited<ReturnType<typeof browseSampleMemories>>;

/** Displays local setup, sample search, and private account connection controls.
 * @returns The expandable sandbox setup panel.
 */
export function SandboxPanel() {
  const [status, setStatus] = useState<SandboxStatus>();
  const [setupError, setSetupError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [twoFaToken, setTwoFaToken] = useState<string>();
  const [sources, setSources] = useState<SampleSources>();
  const hasError = setupError !== undefined;
  const needsVerification = twoFaToken !== undefined;
  const load = useServerFn(getSandboxStatus);
  const connect = useServerFn(connectMemento);
  const disconnect = useServerFn(disconnectMemento);
  const browse = useServerFn(browseSampleMemories);

  useEffect(() => {
    let current = true;
    const loadStatus = async () => {
      try {
        const result = await load();
        if (current) {
          setStatus(result);
        }
      } catch {
        if (current) {
          setSetupError(
            "Unable to read sandbox setup. Refresh or sign in again."
          );
        }
      }
    };
    void loadStatus();
    return () => {
      current = false;
    };
  }, [load]);

  const handleConnect = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setSetupError(undefined);
    try {
      const result = await connect({
        data: needsVerification
          ? { twoFaToken, code: formText(form, "code") }
          : {
              email: formText(form, "email"),
              password: formText(form, "password"),
            },
      });
      if (result.kind === "two-factor") {
        setTwoFaToken(result.token);
      } else {
        window.location.assign("/s");
      }
    } catch (error) {
      setSetupError(
        error instanceof Error ? error.message : "Unable to connect. Try again."
      );
    }
    setPending(false);
  };

  const handleBrowse = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = formText(new FormData(event.currentTarget), "query");
    setSetupError(undefined);
    setPending(true);
    try {
      setSources(await browse({ data: { query } }));
    } catch {
      setSetupError("Sample search is unavailable. Try again.");
    }
    setPending(false);
  };

  const handleDisconnect = async () => {
    setPending(true);
    setSetupError(undefined);
    try {
      await disconnect();
      window.location.assign("/s");
    } catch {
      setSetupError("Unable to disconnect. Try again.");
      setPending(false);
    }
  };

  return (
    <details className="border-border bg-card rounded-xl border text-left">
      <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 p-4 text-sm">
        <span className="font-medium">Memory sources & test setup</span>
        <span className="text-muted-foreground text-xs">
          {status?.memoryMode === "memento"
            ? `${status.accountName ?? "Connected"} · Personal memories`
            : "Fictional sample memories"}
        </span>
      </summary>
      <div className="flex max-h-[50dvh] flex-col gap-5 overflow-y-auto px-4 pb-4">
        <p className="text-muted-foreground text-sm">
          {status?.liveConfigured === true
            ? "Direct DeepSeek chat is configured."
            : "Live chat needs a DeepSeek API key in the sandbox’s local environment. You can browse sample memories below while it is being configured."}
        </p>
        <p className="text-muted-foreground text-sm">
          {status?.webSearchConfigured === true
            ? "Web research uses OpenRouter and may incur search charges there."
            : "Web research needs an OpenRouter API key in the sandbox’s local environment."}
        </p>
        <section
          className="flex flex-col gap-3"
          aria-labelledby="sample-heading"
        >
          <h2 id="sample-heading" className="text-sm font-medium">
            Try the fictional collection
          </h2>
          <p className="text-muted-foreground text-xs">
            These belong to a fictional Alex. They are not your memories. Search
            for family, gardening, Lisbon, woodworking, or storytelling.
          </p>
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              void handleBrowse(event);
            }}
          >
            <Input
              name="query"
              aria-label="Search fictional sample memories"
              placeholder="Try gardening or family…"
              required
              maxLength={200}
              disabled={pending}
            />
            <Button variant="outline" disabled={pending} type="submit">
              Browse samples
            </Button>
          </form>
          {sources ? <MemorySources sources={sources} /> : null}
        </section>
        <section
          className="border-border flex flex-col gap-3 border-t pt-4"
          aria-labelledby="account-heading"
        >
          <h2 id="account-heading" className="text-sm font-medium">
            {status?.memoryMode === "memento"
              ? "Your Memento connection"
              : "Connect your Memento memories"}
          </h2>
          <p className="text-muted-foreground text-xs">
            Read-only access. Connecting starts a fresh chat. Memory excerpts
            used in answers are sent to the configured AI provider.
          </p>
          <ConnectedAccountForm
            status={status}
            pending={pending}
            twoFaToken={twoFaToken}
            onConnect={(event) => {
              void handleConnect(event);
            }}
            onDisconnect={() => {
              void handleDisconnect();
            }}
            onBack={() => {
              setTwoFaToken(undefined);
            }}
          />
        </section>
        {hasError ? (
          <p className="text-destructive text-sm" role="alert">
            {setupError}
          </p>
        ) : null}
      </div>
    </details>
  );
}

/** Renders the connection controls for the current local setup.
 * @param props - Account status and connection actions.
 * @returns The account form or the appropriate setup feedback.
 */
function ConnectedAccountForm({
  status,
  pending,
  twoFaToken,
  onConnect,
  onDisconnect,
  onBack,
}: {
  /** Current sandbox configuration. */
  readonly status: SandboxStatus | undefined;
  /** Whether an account or search action is running. */
  readonly pending: boolean;
  /** The pending two-factor challenge token. */
  readonly twoFaToken: string | undefined;
  /** Submits credentials or a verification code. */
  readonly onConnect: (event: SubmitEvent<HTMLFormElement>) => void;
  /** Removes the current private connection. */
  readonly onDisconnect: () => void;
  /** Returns to the credentials form. */
  readonly onBack: () => void;
}) {
  const needsVerification = twoFaToken !== undefined;
  if (status?.memoryMode === "memento") {
    return (
      <Button variant="outline" disabled={pending} onClick={onDisconnect}>
        Disconnect and use samples
      </Button>
    );
  }
  if (status?.mementoConfigured !== true) {
    return (
      <p className="text-muted-foreground text-sm">
        The sandbox owner can enable this by setting the Memento API address.
        Sample memories work without a Memento connection.
      </p>
    );
  }
  return (
    <form className="flex flex-col gap-3" onSubmit={onConnect}>
      {needsVerification ? (
        <label className="flex flex-col gap-2 text-sm" htmlFor="memento-code">
          Verification code
          <Input
            id="memento-code"
            name="code"
            autoComplete="one-time-code"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            disabled={pending}
          />
        </label>
      ) : (
        <>
          <label
            className="flex flex-col gap-2 text-sm"
            htmlFor="memento-email"
          >
            Memento email
            <Input
              id="memento-email"
              name="email"
              type="email"
              autoComplete="username"
              required
              disabled={pending}
            />
          </label>
          <label
            className="flex flex-col gap-2 text-sm"
            htmlFor="memento-password"
          >
            Memento password
            <Input
              id="memento-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={pending}
            />
          </label>
        </>
      )}
      <Button variant="outline" type="submit" disabled={pending}>
        {pending ? <Spinner /> : null}
        {needsVerification ? "Verify and connect" : "Connect read-only"}
      </Button>
      {needsVerification ? (
        <Button variant="ghost" disabled={pending} onClick={onBack}>
          Back to sign in
        </Button>
      ) : null}
    </form>
  );
}

/** Reads a textual form field without accepting file values.
 * @param form - The submitted form fields.
 * @param name - The field to read.
 * @returns The field text or an empty string.
 */
function formText(form: FormData, name: string): string {
  const result = z.string().safeParse(form.get(name));
  return result.success ? result.data : "";
}
