import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";

import { clearAuth, seedAuth } from "@/test";
import { server } from "@/test/mocks/server";
import type { IFile } from "@/utility/interface";
import { MediaItem } from "./select-from-media";

const API = "http://localhost:3000/api";

describe("MediaItem", () => {
  afterEach(() => clearAuth());

  it("refreshes a failed signed library thumbnail", async () => {
    seedAuth();
    const file: IFile = {
      _id: "file-1",
      url: "/files/photo.jpg?cap=old",
      name: "photo.jpg",
      type: "image/jpeg",
      size: 100,
      access: {
        expires_at: "2099-01-01T00:00:00.000Z",
        refresh_endpoint: "/files/file-1/access",
      },
    };
    server.use(
      http.post(`${API}/files/file-1/access`, () =>
        HttpResponse.json({
          status: 200,
          success: true,
          message: "File access refreshed successfully",
          data: { ...file, url: "/files/photo.jpg?cap=new" },
          meta: { contract_version: "2026-08", request_id: "request-1" },
        }),
      ),
    );

    render(
      <MediaItem file={file} isSelected={false} onToggle={vi.fn()} />,
    );
    const image = screen.getByRole("img", { name: "photo.jpg" });
    fireEvent.error(image);

    await waitFor(() =>
      expect(image).toHaveAttribute("src", "/files/photo.jpg?cap=new"),
    );
  });
});
