import UserItem from "@/components/user-item";
import GroupUsersIcon from "@/public/icon/group-users.svg";
import { cn } from "@/utility";
import { tagColors } from "@/utility/constant";
import type { ICapsule } from "@/utility/interface";
import dayjs from "dayjs";
import { Link } from "react-router-dom";

export default function TimeCapsuleRow({ capsule }: { capsule: ICapsule }) {
  return (
    <tr>
      <td>
        {capsule.recipients.length > 1 ? (
          <UserItem
            image={
              <span className="text-foreground">
                <GroupUsersIcon width={16} />
              </span>
            }
            name="Multiple contacts"
            email={capsule.recipients[0].email}
          />
        ) : (
          <UserItem
            name={`${capsule.recipients[0]?.first_name || ""} ${capsule.recipients[0]?.last_name || ""}`}
            email={capsule.recipients[0]?.email}
            image={capsule.recipients[0]?.picture_url}
          />
        )}
      </td>
      <td>{dayjs(capsule.created_at).format("MMM DD, YYYY")}</td>
      <td>
        <span className="mem-tags">
          {dayjs(capsule.schedule_date).format("MMM DD, YYYY")}
        </span>
      </td>
      <td>
        <span className="block truncate whitespace-nowrap font-inter text-sm max-w-49">
          {capsule?.body || capsule?.title}
        </span>
      </td>
      <td>
        <span className={cn("mem-tags", tagColors[capsule.status])}>
          {capsule.status}
        </span>
      </td>
      <td>
        <Link
          to={`/time-capsule/${capsule?._id}`}
          className="underline underline-offset-2 cursor-pointer text-primary text-xs font-inter"
        >
          Details
        </Link>
      </td>
    </tr>
  );
}
