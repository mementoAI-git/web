import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  shouldRefreshSignedMedia,
  useSignedMediaAccess,
} from "./signed-media-access";
import type { IFile } from "@/utility/interface";

const attachment: IFile = {
  _id: "file-1",
  name: "photo.jpg",
  type: "image/jpeg",
  size: 100,
  url: "/files/photo.jpg?cap=old",
  access: {
    expires_at: "2026-08-28T12:00:00.000Z",
    refresh_endpoint: "/files/file-1/access",
  },
};

describe("signed media access", () => {
  it("recognizes expired capabilities but leaves legacy URLs alone", () => {
    expect(
      shouldRefreshSignedMedia(
        attachment,
        new Date("2026-08-28T12:01:00.000Z").getTime(),
      ),
    ).toBe(true);
    expect(
      shouldRefreshSignedMedia(
        { ...attachment, access: undefined },
        new Date("2026-08-28T12:01:00.000Z").getTime(),
      ),
    ).toBe(false);
  });

  it("refreshes a failed signed URL once and reuses returned metadata", async () => {
    const requester = vi.fn().mockResolvedValue({
      success: true,
      message: "refreshed",
      data: {
        ...attachment,
        url: "/files/photo.jpg?cap=new",
        access: {
          ...attachment.access,
          expires_at: "2026-08-28T13:00:00.000Z",
        },
      },
    });
    const { result } = renderHook(() =>
      useSignedMediaAccess(attachment, requester, { refreshExpired: false }),
    );

    await act(async () => {
      await result.current.onError();
      await result.current.onError();
    });

    expect(requester).toHaveBeenCalledTimes(1);
    expect(requester).toHaveBeenCalledWith("/files/file-1/access", { arg: {} });
    expect(result.current.src).toBe("/files/photo.jpg?cap=new");
    expect(result.current.attachment.access?.expires_at).toBe(
      "2026-08-28T13:00:00.000Z",
    );
  });

  it("does not call the API for a legacy media failure", async () => {
    const requester = vi.fn();
    const legacy = { ...attachment, access: undefined };
    const { result } = renderHook(() =>
      useSignedMediaAccess(legacy, requester, { refreshExpired: false }),
    );

    await act(async () => result.current.onError());
    expect(requester).not.toHaveBeenCalled();
    expect(result.current.src).toBe(legacy.url);
  });

  it("refuses absolute and unrelated refresh endpoints", async () => {
    const requester = vi.fn();
    const unsafeAttachments = [
      {
        ...attachment,
        access: {
          ...attachment.access!,
          refresh_endpoint: "https://evil.test/collect",
        },
      },
      {
        ...attachment,
        access: {
          ...attachment.access!,
          refresh_endpoint: "/users/profile",
        },
      },
    ];

    for (const unsafeAttachment of unsafeAttachments) {
      const { result, unmount } = renderHook(() =>
        useSignedMediaAccess(unsafeAttachment, requester, {
          refreshExpired: false,
        }),
      );

      await act(async () => result.current.onError());
      expect(result.current.src).toBe(unsafeAttachment.url);
      unmount();
    }

    expect(requester).not.toHaveBeenCalled();
  });
});
