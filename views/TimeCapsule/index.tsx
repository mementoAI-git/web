"use client";

import { StatCard } from "../Dashboard";
import CalendarIcon from "@/public/icon/calendar-1.svg";
import BookmarkIcon from "@/public/icon/dashboard/bookmark.svg";
import TimeCapsulesHeader from "./Header";
import Table from "@/components/Table";
import TimeCapsuleRow from "./Row";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import { ICapsule } from "@/utility/interface";
import { useState } from "react";

const columns = [
  { label: "Recipient", className: "!w-[25%]" },
  { label: "Date created", className: "!w-[12%]" },
  { label: "Delivery date", className: "!w-[19%]" },
  { label: "Message", className: "!w-[23%]" },
  { label: "Status" },
  { label: "Action" }
]

export default function TimeCapsule() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useSWR(`${endpoint.capsule}?page=${page}`)

  return (
    <div className="w-full overflow-y-auto">
      <div className="space-y-4 py-8">
        <div className="flex items-center gap-3">
          <StatCard
            icon={<CalendarIcon width={20} height={16} />}
            subtitle="Capsules created"
            title="0"
          />
          <StatCard
            icon={<BookmarkIcon width={14} height={18} />}
            subtitle="bookmarks"
            title="0"
          />
        </div>
      </div>
      <div className="space-y-6 py-8">
        <TimeCapsulesHeader count={data?.data?.totalDocs || 0} />
        <Table
          data={data?.data}
          columns={columns}
          loading={isLoading}
          onChangePage={setPage}
          renderRow={(r: ICapsule, i) => <TimeCapsuleRow key={i} capsule={r} />}
        />
      </div>
    </div>
  )
}