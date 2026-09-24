import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ImageThumbnail from "./image-thumbnail";

describe("ImageThumbnail", () => {
  it("contains its rotated image layers in a local stacking context", () => {
    const { container } = render(<ImageThumbnail images={[]} />);

    expect(container.firstElementChild).toHaveClass("isolate");
  });
});
