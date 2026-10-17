import { Button } from "@/components/ui/button";
import { useRequestRecovery } from "@/hooks/use-request-recovery";
import { isUnavailablePublicLink } from "@/lib/public-link-status";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Logo from "@/components/logo";
import endpoint from "@/api/endpoint";
import type { IResponse } from "@/api/interface";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

async function publicCapsuleRequest<T>(
  path: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "omit",
    cache: "no-store",
    referrerPolicy: "no-referrer",
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  if (!response.ok) throw Object.assign(new Error("Capsule request failed"), { httpStatus: response.status });
  const envelope = (await response.json()) as IResponse<T>;
  if (!envelope.data) throw new Error("Capsule response is empty");
  return envelope.data;
}

type ExternalCapsule = {
  _id: string;
  title: string;
  body: string;
  schedule_date?: string;
  style?: { backgroundColor?: string };
  attachments?: Array<{ _id?: string; name?: string; type?: string }>;
  memories?: Array<{ _id?: string; title?: string }>;
};

export default function CapsuleViewPage() {
  const location = useLocation();
  const token = new URLSearchParams(location.search).get("token");
  return <CapsuleSession key={token ?? "missing-token"} token={token} />;
}

function CapsuleSession({ token }: { token: string | null }) {
  const location = useLocation();
  const [capsule, setCapsule] = useState<ExternalCapsule | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);
  const grantRef = useRef<string | null>(null);
  const requestRef = useRef<Promise<ExternalCapsule> | null>(null);
  const unavailable = !token || isUnavailablePublicLink(error);
  const retryRequest = useCallback(async () => {
    requestRef.current = null;
    setError(null);
    setAttempt(value => value + 1);
  }, []);
  const retry = useRequestRecovery("public-capsule", !unavailable && error, retryRequest, "Your capsule couldn’t be loaded. Try again.");

  useLayoutEffect(() => {
    if (location.search) {
      window.history.replaceState(window.history.state, "", location.pathname);
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    if (!requestRef.current) {
      requestRef.current = (async () => {
        if (!grantRef.current) {
          const exchanged = await publicCapsuleRequest<{ grant: string }>(endpoint.capsuleViewExchange, {
            method: "POST",
            body: JSON.stringify({ token }),
          });
          if (!exchanged.grant) throw new Error("Missing capsule view grant");
          grantRef.current = exchanged.grant;
        }
        return publicCapsuleRequest<ExternalCapsule>(endpoint.capsuleView, {
          method: "GET",
          headers: { "x-capsule-view-grant": grantRef.current },
        });
      })();
    }
    void requestRef.current.then(
      viewed => { if (active) setCapsule(viewed); },
      failure => { if (active) setError(failure); },
    );
    return () => {
      active = false;
    };
  }, [token, attempt]);

  return (
    <div className="min-h-screen bg-background px-5 py-8 text-text-neutral-strong sm:px-8">
      <meta name="referrer" content="no-referrer" />
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between border-b border-stroke-neutral-weaker pb-6">
        <Logo />
        <span className="rounded-full border border-stroke-neutral-weak bg-fill-neutral-weaker px-3 py-1 font-inter text-xs font-semibold uppercase tracking-widest text-text-neutral-weak">
          Private capsule
        </span>
      </header>
      <main className="mx-auto flex w-full max-w-3xl justify-center py-12">
        {!capsule && !error && !unavailable ? (
          <div aria-label="Opening capsule" className="w-full animate-pulse motion-reduce:animate-none rounded-[32px] border border-stroke-neutral-weaker bg-bg-neutral-solid p-8">
            <div className="h-8 w-2/3 rounded-full bg-fill-neutral-weak" />
            <div className="mt-8 h-4 w-full rounded-full bg-fill-neutral-weaker" />
            <div className="mt-3 h-4 w-4/5 rounded-full bg-fill-neutral-weaker" />
          </div>
        ) : capsule ? (
          <article className="w-full rounded-[32px] border border-stroke-neutral-weaker bg-bg-neutral-solid p-7 shadow-sm sm:p-10">
            <p className="font-inter text-xs font-bold uppercase tracking-widest text-text-neutral-weaker">
              A moment saved for you
            </p>
            <h1 className="mt-4 font-garamond text-4xl leading-tight text-text-neutral-strong sm:text-5xl">
              {capsule.title}
            </h1>
            <p className="mt-7 whitespace-pre-wrap font-inter text-base leading-7 text-text-neutral-weak">
              {capsule.body}
            </p>
            {!!capsule.attachments?.length && (
              <p className="mt-8 rounded-2xl bg-fill-neutral-weaker px-4 py-3 font-inter text-sm text-text-neutral-weak">
                {capsule.attachments.length} private attachment{capsule.attachments.length === 1 ? "" : "s"} included
              </p>
            )}
          </article>
        ) : !unavailable ? (
          <Button variant="outline" onClick={retry}>Retry opening capsule</Button>
        ) : (
          <div className="w-full rounded-[32px] border border-stroke-neutral-weaker bg-bg-neutral-solid p-10 text-center">
            <h1 className="font-garamond text-4xl text-text-neutral-strong">
              This capsule can’t be opened
            </h1>
            <p className="mt-3 font-inter text-sm leading-6 text-text-neutral-weak">
              {!token ? "Open the original link from your invitation. If you already opened it, ask the sender to send a new link." : "The private link may have expired or already been used. Ask the sender to try delivery again."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
