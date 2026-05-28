import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { renderWithProviders } from "@/test";
import { server } from "@/test/mocks/server";

import TimeCapsulePage from "./index";

const API = "http://localhost:3000/api";

describe("TimeCapsulePage gating", () => {
  it("reopens timed-message upgrade prompt after maybe later", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(`${API}/billing/subscription`, () =>
        HttpResponse.json({
          success: true,
          data: {
            tier: "free",
            status: "active",
            features: [],
            usage: {
              storage_used_bytes: 0,
              beneficiary_count: 0,
              timed_message_count: 5,
            },
          },
        }),
      ),
    );

    renderWithProviders(<TimeCapsulePage />, { route: "/capsule", auth: true });

    const createButton = await screen.findByRole("button", { name: /create new/i });
    await user.click(createButton);
    await user.click(await screen.findByRole("button", { name: /let me think about it/i }));

    await user.click(screen.getByRole("button", { name: /create new/i }));
    expect(await screen.findByRole("heading", { name: /more timed messages with pro/i })).toBeInTheDocument();
  });
});
