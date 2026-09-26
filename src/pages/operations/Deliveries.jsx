import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import SearchBar from "../../components/SearchBar";
import FilterBar from "../../components/FilterBar";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import Button from "../../components/Button";
import { listDeliveries } from "../../services/deliveryService";
import { STATUSES, WAREHOUSES } from "../../utils/constants";

export default function Deliveries() {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});

  useEffect(() => {
    listDeliveries().then(setDeliveries);
  }, []);

  const rows = useMemo(() => {
    return deliveries
      .filter((d) => !filters.status || d.status === filters.status)
      .filter((d) => !filters.warehouse || d.warehouse === filters.warehouse)
      .filter((d) => !search || d.id.toLowerCase().includes(search.toLowerCase()) || d.customer.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [deliveries, search, filters]);

  const warehouseName = (id) => WAREHOUSES.find((w) => w.id === id)?.name || id;

  return (
    <div>
      <PageHeader
        title="Delivery orders"
        description="Outgoing stock for customer shipments. Validate once picked and packed."
        actions={
          <Button icon={Plus} onClick={() => navigate("/deliveries/new")}>
            New delivery
          </Button>
        }
      />
      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by order no. or customer" />
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
          { key: "id", label: "Order" },
          { key: "customer", label: "Customer" },
          { key: "warehouse", label: "Source", render: (d) => warehouseName(d.warehouse) },
          { key: "date", label: "Date" },
          { key: "lines", label: "Lines", align: "right", render: (d) => d.lines.length },
          { key: "status", label: "Status", render: (d) => <StatusBadge status={d.status} /> },
        ]}
        rows={rows}
        onRowClick={(d) => navigate(`/deliveries/${d.id}`)}
      />
    </div>
  );
}
