import Table from "@/components/Table";
import Row from "./Row"
import classNames from "classnames";
import Header from "./Header";

const mockdata = {
  docs: [1, 2, 3],
  hasPrevPage: false,
  hasNextPage: true,
  totalPages: 5,
  limit: 2,
  totalDocs: 100,
  nextPage: 5,
  prevPage: 3,
  pagingCounter: 4,
  page: 2
}
const columns = [
  { label: "recipient" },
  { label: "date added" },
  { label: "relationship" },
  { label: "permission level" },
  { label: "Actions", className: "text-right" },
]

export function Beneficiaries() {
  return (
    <div>
      <div className="space-y-3 py-8">
        <h4 className="page-title">Beneficiaries</h4>
        <small className="text-base font-inter text-grey-600">Manage Beneficiaries and their access to your content</small>
      </div>
      <div className="py-8 space-y-6">
        <Header />
        <Table
          data={mockdata}
          columns={columns}
          renderRow={(r) => <Row key={r} />}
        />
      </div>
    </div>
  )
}