import { UserAvatar } from "@/components/user-avatar";
import { isEmpty } from "@/utility";

type Recipient = {
  _id: string;
  name: string;
  email?: string;
  relationship: string;
  avatar: string;
  user?: {
    name?: string;
    picture_url?: string;
  };
};
interface RecentRecipientsProps {
  recipients: Recipient[];
  selectedRecipients?: string[];
  onSelect?: (recipient: Recipient) => void;
  onSeeAll?: () => void;
  hideRelationship?: boolean;
}
export default function RecentRecipients({
  recipients = [],
  selectedRecipients = [],
  onSelect,
  onSeeAll,
  hideRelationship = false,
}: RecentRecipientsProps) {
  const displayedRecipients = recipients.slice(0, 4);
  const hasMore = recipients.length > 4;

  const totalButtons = displayedRecipients.length + (hasMore ? 1 : 0);

  if (!recipients.length) {
    return (
      <div className="flex flex-col items-center justify-center py-6 gap-2">
        <UserAvatar alt="No recipients" size="lg" className="opacity-30" />
        <p className="text-xs text-gray-400">No recent recipients</p>
      </div>
    );
  }

  return (
    <div
      className={`grid gap-1 w-full scrollbar-hide`}
      style={{ gridTemplateColumns: `repeat(${totalButtons}, 1fr)` }}
    >
      {/* First 4 Recipients */}
      {displayedRecipients.map((recipient) => {
        const displayName = (
          recipient.name ||
          recipient.user?.name ||
          recipient.email ||
          ""
        ).split(/[@\s]/)[0];
        const initialsSource =
          recipient.name || recipient.user?.name || recipient.email?.split("@")[0] || "";
        const isSelected = selectedRecipients.includes(recipient.email);
        return (
          <button
            key={recipient._id}
            type="button"
            onClick={() => onSelect?.(recipient)}
            className={`inline-flex max-w[100px] rounded-lg py-2 px-3 flex-col items-center gap-1 group cursor-pointer hover:bg-gray-50 transition-all border border-solid ${
              isSelected
                ? "border-green-0 ring-px ring-green-0"
                : "border-[#EBEBEB]"
            }`}
          >
            {/* Avatar */}
            <div className="flex size-6 items-center justify-center overflow-hidden rounded-full transition-transform group-hover:scale-105">
              <UserAvatar
                alt={recipient.name}
                src={!isEmpty(recipient?.user?.picture_url) ? recipient.user?.picture_url : undefined}
                name={initialsSource || undefined}
                email={recipient.email}
                size="sm"
                className="!rounded-full"
              />
            </div>
            {/* Name */}
            <div className="text-center">
              <p className="text-xs font-medium text-gray-800 leading-[18px] text-ellipsis">
                {/*{(recipient.name ? recipient.name.split(" ")[0] : "") ||
                  (recipient.user?.name
                    ? recipient.user.name.split(" ")[0]
                    : "") ||
                  (recipient.email ? recipient.email.split("@")[0] : "")
                }*/}
                {displayName}
              </p>
              {!hideRelationship && (
                <p className="text-xs font-light text-gray-800 leading-5">
                  {recipient.relationship}
                </p>
              )}
            </div>
          </button>
        );
      })}

      {hasMore && (
        <button
          onClick={onSeeAll}
          className="flex items-center justify-center border border-dashed border-black/10 rounded-lg flex-col gap-1.5 group cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <div className=" rounded-full items-center flex justify-center overflow-hidden transition-transform group-hover:scale-105">
            <img
              src="/icon/eye.svg"
              alt="See all"
              className="w-6 h-6 object-contain"
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-orange leading-[18px] whitespace-nowrap">
              See all
            </p>
            {/*<p className="text-xs font-normal text-gray-500 leading-5 invisible">
              &nbsp;
            </p>*/}
          </div>
        </button>
      )}
    </div>
  );
}
