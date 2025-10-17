"use client"

import Table from "@/components/Table";
import Row from "./Row"
import Header from "./Header";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import { useState } from "react";

const columns = [
  { label: "recipient", className: "w-[22%] max-w-[170px]" },
  { label: "date added", className: "!w-[15%]" },
  { label: "relationship", className: "!w-[19%]" },
  { label: "permission level", className: "!w-[23%]" },
  { label: "Actions", className: "text-right" },
]

export default function Beneficiaries() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useSWR(`${endpoint.beneficiaries}?page=${page}`)
  return (
    <div className="w-full flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <span className="font-inter text-base font-bold text-gray-950/90">Beneficiary</span>
        <span className="font-inter text-sm text-gray-950/70">
          Your beneficiaries are allowed access to your Memento
        </span>
      </div>
      <div className=" space-y-6">
        <Header count={data?.data?.totalDocs} />
        <div className="w-full text-xs overflow-x-auto hide-scrollbar">
          <Table
            data={data?.data}
            columns={columns}
            loading={isLoading}
            headerClassName="text-gray-500 !text-xs"
            renderRow={(r, i) => <Row beneficiary={r} key={i} />}
            onChangePage={setPage}
          />
        </div>
      </div>
    </div>
  )
}