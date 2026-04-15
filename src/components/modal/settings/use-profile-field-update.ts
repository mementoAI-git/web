import endpoint from "@/api/endpoint";
import useFetcher from "@/hooks/use-fetcher";
import { useStore } from "@/hooks/use-store";
import type { IUser } from "@/utility/interface";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export function useProfileFieldUpdate<K extends keyof IUser>(name: K) {
  const { user, hydrated } = useStore();
  const { isMutating, trigger } = useFetcher(endpoint.profile, "put");
  const [value, setValue] = useState("");

  const cachedValue = useMemo(() => {
    if (!user) return "";
    const fieldValue = user[name];
    if (fieldValue == null) return "";
    return String(fieldValue);
  }, [name, user]);

  useEffect(() => {
    if (hydrated) {
      setValue(cachedValue);
    }
  }, [cachedValue, hydrated]);

  const save = async () => {
    if (!user) return;
    if (value === cachedValue) return;

    const result = await trigger({ [name]: value } as Partial<Record<keyof IUser, unknown>>);
    if (result?.data) {
      toast.success(result?.message);
    }
  };

  return {
    value,
    setValue,
    cachedValue,
    isMutating,
    save,
    hasUser: Boolean(user),
  };
}
