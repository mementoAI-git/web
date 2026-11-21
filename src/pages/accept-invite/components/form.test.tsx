import { act, screen } from "@testing-library/react";
import { renderWithProviders } from "@/test";
import type { IBeneficiary } from "@/utility/interface";
import AcceptInviteForm from "./form";

describe("invitation acceptance copy", () => {
  it.each(["shared_only", "full_vault"])(
    "explains %s invitations accurately",
    async (access_scope) => {
      const data = {
        _id: "invite-1",
        name: "Ada",
        email: "ada@example.com",
        relationship: "Friend",
        level: 1,
        user: { email: "ada@example.com" },
        benefactor: { first_name: "Wisdom" },
        access_scope,
      } as IBeneficiary;
      await act(async () => {
        renderWithProviders(<AcceptInviteForm data={data} />);
      });
      if (access_scope === "shared_only") {
        expect(
          screen.getByText(/keep memories together in a private shared space/i),
        ).toBeInTheDocument();
        expect(screen.queryByText(/as a connection on their profile/i)).not.toBeInTheDocument();
      } else expect(screen.getByText(/as a connection on their profile/i)).toBeInTheDocument();
    },
  );
});
