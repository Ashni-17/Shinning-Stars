import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import SearchBar from "../../components/SearchBar";
import FilterBar from "../../components/FilterBar";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import Button from "../../components/Button";
import { listAdjustments } from "../../services/adjustmentService";
import { STATUSES, WAREHOUSES } from "../../utils/constants";

export default function Adjustments() {
  const navigate = useNavigate();
  const [adjustments, setAdjustments] = useState([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});

  useEffect(() => {
    listAdjustments().then(setAdjustments);
  }, []);

  const warehouseName = (id) => WAREHOUSES.find((w) => w.id === id)?.name || id;

  const rows = useMemo(() => {
    return adjustments
      .filter((a) => !filters.status || a.status === filters.status)
      .filter((a) => !search || a.id.toLowerCase().includes(search.toLowerCase()) || a.reason.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [adjustments, search, filters]);

  return (
    <div>
      <PageHeader
        title="Stock adjustments"
        description="Fix mismatches between recorded stock and physical counts."
        actions={
          <Button icon={Plus} onClick={() => navigate("/adjustments/new")}>
            New adjustment
          </Button>
        }
      />
      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by adjustment no. or reason" />
        <FilterBar
          filters={[{ key: "status", label: "Status", options: STATUSES.map((s) => ({ value: s, label: s })) }]}
          active={filters}
          onChange={(key, value) => setFilters((f) => ({ ...f, [key]: value }))}
        />
      </div>
      <DataTable
        columns={[
          { key: "id", label: "Adjustment" },
          { key: "warehouse", label: "Location", render: (a) => warehouseName(a.warehouse) },
          { key: "reason", label: "Reason" },
          { key: "date", label: "Date" },
          { key: "status", label: "Status", render: (a) => <StatusBadge status={a.status} /> },
        ]}
        rows={rows}
        onRowClick={(a) => navigate(`/adjustments/${a.id}`)}
      />
    </div>
  );
}
