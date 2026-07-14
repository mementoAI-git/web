import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import UploadItem from "./upload-item";

describe("UploadItem", () => {
  it("shows uploading progress while a file is in flight", () => {
    render(
      <UploadItem
        file={{
          id: "file-1",
          file: new File(["a"], "voice-note.m4a", { type: "audio/mp4" }),
          progress: 42,
        }}
        onDelete={() => {}}
      />,
    );

    expect(screen.getByText("Uploading")).toBeInTheDocument();
    expect(screen.getByText("42%")).toBeInTheDocument();
  });

  it("shows ready state when upload is complete", () => {
    render(
      <UploadItem
        file={{
          id: "file-2",
          file: new File(["a"], "family-photo.png", { type: "image/png" }),
          progress: 100,
        }}
        onDelete={() => {}}
      />,
    );

    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});
