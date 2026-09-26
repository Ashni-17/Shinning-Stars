import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import SearchBar from "../../components/SearchBar";
import FilterBar from "../../components/FilterBar";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import Button from "../../components/Button";
import { listReceipts } from "../../services/receiptService";
import { STATUSES, WAREHOUSES } from "../../utils/constants";

export default function Receipts() {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});

  useEffect(() => {
    listReceipts().then(setReceipts);
  }, []);

  const rows = useMemo(() => {
    return receipts
      .filter((r) => !filters.status || r.status === filters.status)
      .filter((r) => !filters.warehouse || r.warehouse === filters.warehouse)
      .filter((r) => !search || r.id.toLowerCase().includes(search.toLowerCase()) || r.supplier.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [receipts, search, filters]);

  const warehouseName = (id) => WAREHOUSES.find((w) => w.id === id)?.name || id;

  return (
    <div>
      <PageHeader
        title="Receipts"
        description="Incoming stock from suppliers. Validate a receipt to add it to inventory."
        actions={
          <Button icon={Plus} onClick={() => navigate("/receipts/new")}>
            New receipt
          </Button>
        }
      />
      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by receipt no. or supplier" />
        <FilterBar
          filters={[
            { key: "status", label: "Status", options: STATUSES.map((s) => ({ value: s, label: s })) },
            { key: "warehouse", label: "Warehouse", options: WAREHOUSES.map((w) => ({ value: w.id, label: w.name })) },
          ]}
          active={filters}
          onChange={(key, value) => setFilters((f) => ({ ...f, [key]: value }))}
        />
      </div>
      <DataTable
        columns={[
          { key: "id", label: "Receipt" },
          { key: "supplier", label: "Supplier" },
          { key: "warehouse", label: "Destination", render: (r) => warehouseName(r.warehouse) },
          { key: "date", label: "Date" },
          { key: "lines", label: "Lines", align: "right", render: (r) => r.lines.length },
          { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
        ]}
        rows={rows}
        onRowClick={(r) => navigate(`/receipts/${r.id}`)}
      />
    </div>
  );
}
