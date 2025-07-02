"use client"

import Table from "@/components/Table";
import Row from "./Row"
import Header from "./Header";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import { useState } from "react";

const columns = [
  { label: "recipient" },
  { label: "date added" },
  { label: "relationship" },
  { label: "permission level" },
  { label: "Actions", className: "text-right" },
]

export function Beneficiaries() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useSWR(`${endpoint.beneficiaries}?page=${page}`)
  return (
    <div className="px-2 sm:px-0">
      <div className="space-y-2 sm:space-y-3 py-4 sm:py-8">
        <h4 className="page-title text-2xl sm:text-3xl lg:text-4xl">Beneficiaries</h4>
        <small className="text-sm sm:text-base font-inter text-grey-600">Manage Beneficiaries and their access to your content</small>
      </div>
      <div className="py-4 sm:py-8 space-y-4 sm:space-y-6">
        <Header count={data?.data?.totalDocs} />
        <div className="w-full overflow-x-auto hide-scrollbar">
          <Table
            data={data?.data}
            columns={columns}
            loading={isLoading}
            renderRow={(r, i) => <Row beneficiary={r} key={i} />}
            onChangePage={setPage}
          />
        </div>
      </div>
    </div>
  )
}