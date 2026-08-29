import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  if (!response.ok) throw new Error("Capsule request failed");
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
  const tokenRef = useRef<string | null>(null);
  if (tokenRef.current === null) {
    tokenRef.current = new URLSearchParams(location.search).get("token");
  }
  const token = tokenRef.current;
  const [capsule, setCapsule] = useState<ExternalCapsule | null>(null);
  const [failed, setFailed] = useState(!token);

  useLayoutEffect(() => {
    if (location.search) {
      window.history.replaceState(window.history.state, "", location.pathname);
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    const load = async () => {
      try {
        const exchanged = await publicCapsuleRequest<{
          grant: string;
          expires_at: string;
        }>(endpoint.capsuleViewExchange, {
          method: "POST",
          body: JSON.stringify({ token }),
        });
        const grant = exchanged.grant;
        if (!grant) throw new Error("Missing capsule view grant");
        const viewed = await publicCapsuleRequest<ExternalCapsule>(
          endpoint.capsuleView,
          {
          method: "GET",
          headers: { "x-capsule-view-grant": grant },
          },
        );
        if (active) setCapsule(viewed);
      } catch {
        if (active) setFailed(true);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [token]);

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
        {!capsule && !failed ? (
          <div aria-label="Opening capsule" className="w-full animate-pulse rounded-[32px] border border-stroke-neutral-weaker bg-white p-8">
            <div className="h-8 w-2/3 rounded-full bg-fill-neutral-weak" />
            <div className="mt-8 h-4 w-full rounded-full bg-fill-neutral-weaker" />
            <div className="mt-3 h-4 w-4/5 rounded-full bg-fill-neutral-weaker" />
          </div>
        ) : capsule ? (
          <article className="w-full rounded-[32px] border border-stroke-neutral-weaker bg-white p-7 shadow-sm sm:p-10">
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
        ) : (
          <div className="w-full rounded-[32px] border border-stroke-neutral-weaker bg-white p-10 text-center">
            <h1 className="font-garamond text-4xl text-text-neutral-strong">
              This capsule can’t be opened
            </h1>
            <p className="mt-3 font-inter text-sm leading-6 text-text-neutral-weak">
              The private link may have expired or already been used. Ask the sender to try delivery again.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
