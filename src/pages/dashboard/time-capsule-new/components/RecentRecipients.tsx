import { isEmpty } from "@/utility";
import avatarPlaceholder from "@/assets/image/avatar.png";

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
}
export default function RecentRecipients({
  recipients = [],
  selectedRecipients = [],
  onSelect,
  onSeeAll,
}: RecentRecipientsProps) {
  const displayedRecipients = recipients.slice(0, 4);
  const hasMore = recipients.length > 4;

  const totalButtons = displayedRecipients.length + (hasMore ? 1 : 0);

  return (
    <div
      className={`grid gap-4 w-full`}
      style={{ gridTemplateColumns: `repeat(${totalButtons}, 1fr)` }}
    >
      {/* First 4 Recipients */}
      {displayedRecipients.map((recipient) => {
        const isSelected = selectedRecipients.includes(recipient.email);
        return (
          <button
            key={recipient._id}
            type="button"
            onClick={() => onSelect?.(recipient)}
            className={`inline-flex border max-w-[100px] rounded-lg py-2.5 px-3 flex-col items-center gap-2 group cursor-pointer hover:bg-gray-50 transition-all ${isSelected
              ? "border-green-0 ring-px ring-green-0"
              : "border-black/5"
              }`}
          >
            {/* Avatar */}
            <div className="size-6 rounded-full items-center flex justify-center bg-[#F5F5F5] overflow-hidden transition-transform group-hover:scale-105">
              <img
                src={
                  !isEmpty(recipient?.user?.picture_url)
                    ? recipient?.user?.picture_url
                    : avatarPlaceholder
                }
                alt={recipient.name}
                className="size-full object-cover"
              />
            </div>
            {/* Name */}
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900 leading-[18px] text-ellipsis">
                {
                  (recipient.name ? recipient.name.split(" ")[0] : "") ||
                  (recipient.user?.name ? recipient.user.name.split(" ")[0] : "") ||
                  (recipient.email ? recipient.email.split("@")[0] : "")}
              </p>
              <p className="text-xs font-normal text-gray-500 leading-5">
                {recipient.relationship}
              </p>
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
