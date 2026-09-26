import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import SearchBar from "../../components/SearchBar";
import FilterBar from "../../components/FilterBar";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import Button from "../../components/Button";
import { listTransfers } from "../../services/transferService";
import { STATUSES, WAREHOUSES } from "../../utils/constants";

export default function Transfers() {
  const navigate = useNavigate();
  const [transfers, setTransfers] = useState([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});

  useEffect(() => {
    listTransfers().then(setTransfers);
  }, []);

  const warehouseName = (id) => WAREHOUSES.find((w) => w.id === id)?.name || id;

  const rows = useMemo(() => {
    return transfers
      .filter((t) => !filters.status || t.status === filters.status)
      .filter((t) => !search || t.id.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [transfers, search, filters]);

  return (
    <div>
      <PageHeader
        title="Internal transfers"
        description="Move stock between warehouses, racks, or floors without changing total quantity."
        actions={
          <Button icon={Plus} onClick={() => navigate("/transfers/new")}>
            New transfer
          </Button>
        }
      />
      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by transfer no." />
        <FilterBar
          filters={[{ key: "status", label: "Status", options: STATUSES.map((s) => ({ value: s, label: s })) }]}
          active={filters}
          onChange={(key, value) => setFilters((f) => ({ ...f, [key]: value }))}
        />
      </div>
      <DataTable
        columns={[
          { key: "id", label: "Transfer" },
          { key: "from", label: "From", render: (t) => warehouseName(t.from) },
          { key: "to", label: "To", render: (t) => warehouseName(t.to) },
          { key: "date", label: "Date" },
          { key: "lines", label: "Lines", align: "right", render: (t) => t.lines.length },
          { key: "status", label: "Status", render: (t) => <StatusBadge status={t.status} /> },
        ]}
        rows={rows}
        onRowClick={(t) => navigate(`/transfers/${t.id}`)}
      />
    </div>
  );
}
