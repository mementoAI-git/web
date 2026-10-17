import {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { getPreviewSession } from "./preview-session";

const baseURL = import.meta.env.VITE_API_BASE_URL;

/** Match only this application's API, leaving assets and third-party requests alone. */
function apiPath(input: string, base = baseURL): string | null {
  if (!/^https?:\/\//.test(input)) return input;
  const api = new URL(base, window.location.href);
  const url = new URL(input);
  const prefix = api.pathname.replace(/\/$/, "");
  if (
    url.origin !== api.origin ||
    (url.pathname !== prefix && !url.pathname.startsWith(`${prefix}/`))
  )
    return null;
  return `${url.pathname.slice(prefix.length) || "/"}${url.search}`;
}

export function installPreviewAxios(client: AxiosInstance) {
  const interceptor = client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const session = getPreviewSession();
      if (!session) return config;
      const path = apiPath(config.url ?? "", config.baseURL);
      if (!path) return config;
      // Resolve inside the adapter: uploads remain FormData, while Axios JSON bodies
      // have already passed through transformRequest and can be parsed by the session.
      config.adapter = async (request) => {
        const result = session.request(
          request.method ?? "GET",
          path,
          request.data,
        );
        if (!result) {
          // Infrastructure/catalog GETs and token refresh may use the real adapter.
          const { default: Axios } = await import("axios");
          const adapter = Axios.getAdapter(client.defaults.adapter);
          return adapter(request);
        }
        const response = {
          data: result.body,
          status: result.status,
          statusText:
            result.status === 200 ? "OK" : "Preview action unavailable",
          headers: {},
          config: request,
        };
        if (result.status >= 400)
          throw new AxiosError(
            result.body.message,
            "ERR_BAD_REQUEST",
            request,
            undefined,
            response,
          );
        return response;
      };
      return config;
    },
  );
  return () => client.interceptors.request.eject(interceptor);
}

export function installPreviewFetch() {
  const realFetch = globalThis.fetch;
  const previewFetch: typeof fetch = async (input, init) => {
    const session = getPreviewSession();
    if (!session) return realFetch(input, init);
    const rawUrl = input instanceof Request ? input.url : String(input);
    const path = apiPath(rawUrl);
    if (!path) return realFetch(input, init);
    const method =
      init?.method ?? (input instanceof Request ? input.method : "GET");
    const signal =
      init?.signal ?? (input instanceof Request ? input.signal : undefined);
    signal?.throwIfAborted();
    const body =
      init?.body ??
      (input instanceof Request &&
      !["GET", "HEAD"].includes(method.toUpperCase())
        ? await input.clone().text()
        : undefined);
    signal?.throwIfAborted();
    const result = session.request(method, path, body);
    if (!result) return realFetch(input, init);
    return new Response(result.stream ?? JSON.stringify(result.body), {
      status: result.status,
      headers: {
        "Content-Type": result.stream
          ? "text/plain; charset=utf-8"
          : "application/json",
      },
    });
  };
  globalThis.fetch = previewFetch;
  return () => {
    if (globalThis.fetch === previewFetch) globalThis.fetch = realFetch;
  };
}

function isolates(key: string) {
  // Auth and appearance stay real. Drafts, history, onboarding receipts, and
  // enrichment state start fresh and cannot leak into normal account activity.
  return (
    key !== "memento:auth" &&
    !/theme|appearance/i.test(key) &&
    (/^memento[:_-]/.test(key) ||
      key === "create-memory-drafts" ||
      key === "quick-capture-outbox")
  );
}

export function installPreviewStorage() {
  const { getItem, setItem, removeItem, key: realKey } = Storage.prototype;
  const lengthDescriptor = Object.getOwnPropertyDescriptor(
    Storage.prototype,
    "length",
  );
  function keys(storage: Storage) {
    const realLength = lengthDescriptor.get.call(storage) as number;
    const visible = Array.from(
      { length: realLength },
      (_, index) => realKey.call(storage, index) as string,
    ).filter((key) => !isolates(key));
    return [...visible, ...getPreviewSession().storage.keys()];
  }
  function get(this: Storage, key: string) {
    const session = this === window.localStorage && getPreviewSession();
    return session && isolates(key)
      ? (session.storage.get(key) ?? null)
      : getItem.call(this, key);
  }
  function set(this: Storage, key: string, value: string) {
    const session = this === window.localStorage && getPreviewSession();
    if (session && isolates(key)) session.storage.set(key, String(value));
    else setItem.call(this, key, value);
  }
  function remove(this: Storage, key: string) {
    const session = this === window.localStorage && getPreviewSession();
    if (session && isolates(key)) session.storage.delete(key);
    else removeItem.call(this, key);
  }
  Storage.prototype.getItem = get;
  Storage.prototype.setItem = set;
  Storage.prototype.removeItem = remove;
  function key(this: Storage, index: number) {
    return this === window.localStorage && getPreviewSession()
      ? (keys(this)[index] ?? null)
      : realKey.call(this, index);
  }
  function length(this: Storage) {
    return this === window.localStorage && getPreviewSession()
      ? keys(this).length
      : lengthDescriptor.get.call(this);
  }
  Storage.prototype.key = key;
  Object.defineProperty(Storage.prototype, "length", {
    ...lengthDescriptor,
    get: length,
  });
  return () => {
    if (Storage.prototype.getItem === get) Storage.prototype.getItem = getItem;
    if (Storage.prototype.setItem === set) Storage.prototype.setItem = setItem;
    if (Storage.prototype.removeItem === remove)
      Storage.prototype.removeItem = removeItem;
    if (Storage.prototype.key === key) Storage.prototype.key = realKey;
    if (
      Object.getOwnPropertyDescriptor(Storage.prototype, "length").get ===
      length
    )
      Object.defineProperty(Storage.prototype, "length", lengthDescriptor);
  };
}
