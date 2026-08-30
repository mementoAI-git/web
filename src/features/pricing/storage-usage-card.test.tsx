import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { StorageUsageCard } from "./storage-usage-card";

function renderCard(
  usage: Parameters<typeof StorageUsageCard>[0]["usage"],
  isProOrAbove = false,
) {
  return render(
    <MemoryRouter>
      <StorageUsageCard usage={usage} isProOrAbove={isProOrAbove} />
    </MemoryRouter>,
  );
}

describe("StorageUsageCard", () => {
  it("uses authoritative quota metadata and surfaces active reservations", () => {
    renderCard({
      storage_used_bytes: 100 * 1024 * 1024,
      storage_reserved_bytes: 20 * 1024 * 1024,
      storage_limit_bytes: 200 * 1024 * 1024,
      remaining_bytes: 80 * 1024 * 1024,
      percent_used: 60,
      over_limit: false,
    });

    expect(screen.getByText("100 MB used")).toBeInTheDocument();
    expect(screen.getByText("20 MB currently uploading")).toBeInTheDocument();
    expect(screen.getByText("80 MB available")).toBeInTheDocument();
  });

  it("shows a clear warning when the server reports an over-limit account", () => {
    renderCard({
      storage_used_bytes: 220 * 1024 * 1024,
      storage_limit_bytes: 200 * 1024 * 1024,
      remaining_bytes: 0,
      percent_used: 110,
      over_limit: true,
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Storage is full. Remove some files or upgrade before uploading more.",
    );
  });

  it("treats exactly zero remaining bytes as full", () => {
    renderCard({
      storage_used_bytes: 200 * 1024 * 1024,
      storage_limit_bytes: 200 * 1024 * 1024,
      remaining_bytes: 0,
      percent_used: 100,
      over_limit: false,
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Storage is full. Remove some files or upgrade before uploading more.",
    );
  });

  it("falls back to the compatible 200 MB free quota for older responses", () => {
    renderCard({ storage_used_bytes: 0 });

    expect(screen.getByText("of 200 MB")).toBeInTheDocument();
    expect(screen.getByText(/Free includes 200 MB/)).toBeInTheDocument();
  });

  it("falls back to the compatible 10 GB paid quota for older responses", () => {
    renderCard({ storage_used_bytes: 0 }, true);

    expect(screen.getByText("of 10.0 GB")).toBeInTheDocument();
  });
});
