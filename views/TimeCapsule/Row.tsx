import UserItem from "@/components/UserItem";
import { ICapsule } from "@/utility/interface";
import dayjs from "dayjs";
import Link from "next/link";

export default function TimeCapsuleRow({ capsule }: { capsule: ICapsule }) {
  return (
    <tr>
      <td>
        <UserItem
          name="Agbo francis"
          email="agbofrank531@gmail.com"
        />
      </td>
      <td>{dayjs(capsule.created_at).format("MMM DD, YY")}</td>
      <td>
        <span className="mem-tags">Dec 18, 2025 - 125 days</span>
      </td>
      <td>
        <span className="block truncate whitespace-nowrap font-inter text-sm max-w-49">{capsule?.body || capsule?.title}</span>
      </td>
      <td>
        <span className="mem-tags">Scheduled</span>
      </td>
      <td>
        <Link href={`/time-capsule/${capsule?._id}`} className="underline underline-offset-2 cursor-pointer text-primary text-xs font-inter">Details</Link>
      </td>
    </tr>
  )
}