import { screen, waitFor } from "@testing-library/react";
import { useSWRConfig } from "swr";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { renderWithProviders } from "@/test";
import { server } from "@/test/mocks/server";
import Voices from "./voices";

const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn(), dismiss: vi.fn() }));
vi.mock("sonner", () => ({ toast }));
const endpoint = "http://localhost:3000/api/ai/voices";
const voice = { id: "kore", title: "Kore", subtitle: "warm", gender: "female", voiceName: "Kore" };

function renderVoices() {
  return renderWithProviders(<Voices />, { auth: true, route: "/chat/test" });
}

function RefreshableVoices() {
  const { mutate } = useSWRConfig();
  return <><button onClick={() => { void mutate("/ai/voices?provider=gemini").catch(() => undefined); }}>Refresh voices</button><Voices /></>;
}

describe("voice catalog recovery", () => {
  it("shows loading rather than an empty or failed catalog while requests are pending", async () => {
    let release!: () => void;
    const pending = new Promise<void>((resolve) => { release = resolve; });
    server.use(http.get(endpoint, async () => {
      await pending;
      return HttpResponse.json({ data: { voices: [] } });
    }));
    renderVoices();
    expect(screen.getByRole("status")).toHaveTextContent("Loading voices…");
    expect(screen.queryByText(/No voices/)).not.toBeInTheDocument();
    release();
    expect(await screen.findByText("No voices are available to choose right now.")).toBeInTheDocument();
  });

  it("retains cached choices when a later refresh fails", async () => {
    let failed = false;
    server.use(http.get(endpoint, ({ request }) => {
      if (new URL(request.url).searchParams.get("provider") !== "gemini") return HttpResponse.json({ data: { voices: [] } });
      return failed ? HttpResponse.json({}, { status: 500 }) : HttpResponse.json({ data: { voices: [voice] } });
    }));
    renderWithProviders(<RefreshableVoices />, { auth: true });
    await screen.findByRole("button", { name: /Hannah/ });
    failed = true;
    await userEvent.setup().click(screen.getByRole("button", { name: "Refresh voices" }));
    await screen.findByRole("button", { name: "Retry loading voices" });
    expect(screen.getByRole("button", { name: /Hannah/ })).toBeEnabled();
    expect(screen.queryByText(/No voices/)).not.toBeInTheDocument();
  });

  it("retries the mobile Gemini catalog without requesting an ElevenLabs catalog", async () => {
    let failed = true;
    let geminiRequests = 0;
    let elevenRequests = 0;
    server.use(http.get(endpoint, ({ request }) => {
      if (new URL(request.url).searchParams.get("provider") !== "gemini") {
        elevenRequests++;
        return HttpResponse.json({data: {voices: []}});
      }
      geminiRequests++;
      return failed ? HttpResponse.json({}, {status: 500}) : HttpResponse.json({data: {voices: [voice]}});
    }));
    renderVoices();
    const retry = await screen.findByRole("button", {name: "Retry loading voices"});
    failed = false;
    await userEvent.setup().click(retry);
    expect(await screen.findByRole("button", {name: /Hannah/})).toBeEnabled();
    await waitFor(() => expect(screen.queryByRole("button", {name: "Retry loading voices"})).not.toBeInTheDocument());
    expect(geminiRequests).toBe(2);
    expect(elevenRequests).toBe(0);
  });
});
