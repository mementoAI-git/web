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

  it("shows processing until the server confirms a file, even at 100%", () => {
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

    expect(screen.getByText("Processing")).toBeInTheDocument();
    expect(screen.queryByText("Ready")).not.toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("shows ready only for a confirmed file", () => {
    render(<UploadItem file={{ id: "confirmed", file: new File(["a"], "photo.png"), progress: 100, result: { _id: "server-file" } as never }} onDelete={() => {}} />);
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });
});
