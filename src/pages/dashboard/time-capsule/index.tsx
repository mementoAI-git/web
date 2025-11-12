import endpoint from "@/api/endpoint";
import { useState } from "react";
import useSWR from "swr";
import Table from "@/components/table";
import TimeCapsulesHeader from "./components/header";
import { StatCard } from "../component/stat-card";
import TimeCapsuleRow from "./components/row";
import { AddBookmarkIcon, CalendarIcon } from "@/components/icons";
import type { ICapsule } from "@/utility/interface";

const columns = [
  { label: "Recipient", className: "!w-[25%]" },
  { label: "Date created", className: "!w-[12%]" },
  { label: "Delivery date", className: "!w-[19%]" },
  { label: "Message", className: "!w-[23%]" },
  { label: "Status" },
  { label: "Action" }
]

export default function TimeCapsulePage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useSWR(`${endpoint.capsule}?page=${page}`)

  return (
    <div className="w-[93%] mx-auto">
      <div className="w-full overflow-y-auto">
        <div className="space-y-4 py-8">
          <div className="flex items-center gap-3">
            <StatCard
              icon={<CalendarIcon width={20} height={16} />}
              subtitle="Capsules created"
              title="0"
            />
            <StatCard
              icon={<AddBookmarkIcon width={14} height={18} />}
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
    </div>
  );
}
