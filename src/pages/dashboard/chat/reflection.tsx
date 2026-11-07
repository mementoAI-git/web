import { useEffect, useRef, useState } from "react";
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import Conversation from "./conversation";
import ReflectionLoading from "./reflection-loading";
import type { ReflectionEntry } from "@/lib/reflection-entry";
import { postFetcher } from "@/api/fetcher";
import endpoint from "@/api/endpoint";
import { Button } from "@/components/ui/button";

function OpenReflection({ entry }: { entry: ReflectionEntry }) {
  const navigate = useNavigate();
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const pending = useRef<ReturnType<typeof postFetcher> | null>(null);
  useEffect(() => {
    let active = true;
    setError(false);
    pending.current ??= postFetcher(
      `${endpoint.prompts}/reflection/conversation`,
      { arg: entry.request },
    );
    pending.current
      .then((response) => {
        if (!active) return;
        if (!response?.data?._id) throw new Error("Missing reflection");
        navigate(`/chat/reflection/${response.data._id}`, {
          replace: true,
          state: { reflectionEntry: entry },
        });
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [entry, attempt, navigate]);
  return (
    <ReflectionLoading entry={entry}>
      {error ? (
        <div role="alert" className="flex flex-col items-center gap-3 py-8">
          <p>This reflection couldn’t be opened. Please try again.</p>
          <Button
            variant="outline"
            onClick={() => {
              pending.current = null;
              setAttempt((value) => value + 1);
            }}
          >
            Try again
          </Button>
        </div>
      ) : undefined}
    </ReflectionLoading>
  );
}

export default function ReflectionPage() {
  const { id = "" } = useParams();
  const location = useLocation();
  const entry = location.state?.reflectionEntry as ReflectionEntry | undefined;
  if (id === "new")
    return entry?.question && entry.request ? (
      <OpenReflection entry={entry} />
    ) : (
      <Navigate to="/overview" replace />
    );
  return <Conversation id={id} type="reflection" reflectionEntry={entry} />;
}
