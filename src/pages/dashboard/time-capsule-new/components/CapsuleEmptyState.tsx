import { useModal } from "@/hooks/use-modal";
import Button from "./Button";

interface CapsuleEmptyStateProps {
  showCreateButton?: boolean;
  filterType?: string;
}

const emptyStateContent = {
  all: {
    title: "No time capsules yet",
    description:
      "You haven't created any time capsules yet. Send one to someone from your inner circle, or to yourself.",
  },
  scheduled: {
    title: "No scheduled capsules",
    description:
      "You don't have any capsules scheduled for delivery yet. Create one to get started!",
  },
  delivered: {
    title: "No delivered capsules",
    description:
      "You don't have any delivered capsules yet. Capsules you've sent will appear here once they've been delivered.",
  },
  draft: {
    title: "No draft capsules",
    description:
      "You don't have any draft capsules. Start creating one and save it as a draft.",
  },
};

export function CapsuleEmptyState({
  showCreateButton = false,
  filterType = "all",
}: CapsuleEmptyStateProps) {
  const { open } = useModal();

  const content =
    emptyStateContent[filterType as keyof typeof emptyStateContent] ||
    emptyStateContent.all;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-center flex flex-col items-center">
        <h3 className="text-lg font-semibold font-garamond text-gray-900 mb-2">
          {content.title}
        </h3>
        <p className="text-gray-500 text-sm mt-2 mb-4 max-w-md">
          {content.description}
        </p>
        {showCreateButton && (
          <Button onClick={() => open("create-capsule")}>
            Create a Capsule
          </Button>
        )}
      </div>
    </div>
  );
}
