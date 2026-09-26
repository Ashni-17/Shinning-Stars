import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/PageHeader";
import SearchBar from "../../components/SearchBar";
import FilterBar from "../../components/FilterBar";
import DataTable from "../../components/DataTable";
import { listLedger } from "../../services/ledgerService";
import { getCollection } from "../../services/api";
import { WAREHOUSES, DOC_TYPES } from "../../utils/constants";

export default function MoveHistory() {
  const [ledger, setLedger] = useState([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const products = getCollection("products");

  useEffect(() => {
    listLedger().then((data) => setLedger([...data].sort((a, b) => (a.date < b.date ? 1 : -1))));
  }, []);

  const productById = (id) => products.find((p) => p.id === id);
  const warehouseName = (id) => WAREHOUSES.find((w) => w.id === id)?.name || id;

  const rows = useMemo(() => {
    return ledger
      .filter((l) => !filters.type || l.type === filters.type)
      .filter((l) => !filters.warehouse || l.warehouse === filters.warehouse)
      .filter((l) => {
        if (!search) return true;
        const p = productById(l.productId);
        return (
          l.ref.toLowerCase().includes(search.toLowerCase()) ||
          (p && p.name.toLowerCase().includes(search.toLowerCase()))
        );
      });
  }, [ledger, search, filters]);

  return (
    <div>
      <PageHeader title="Stock ledger" description="Every unit moved, in and out, across every warehouse — the single source of truth." />
      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by reference or product" />
        <FilterBar
          filters={[
            { key: "type", label: "Type", options: DOC_TYPES.map((t) => ({ value: t, label: t })) },
            { key: "warehouse", label: "Warehouse", options: WAREHOUSES.map((w) => ({ value: w.id, label: w.name })) },
          ]}
          active={filters}
          onChange={(key, value) => setFilters((f) => ({ ...f, [key]: value }))}
        />
      </div>
      <DataTable
        columns={[
          { key: "date", label: "Date & time" },
          { key: "ref", label: "Reference" },
          { key: "type", label: "Type" },
          { key: "product", label: "Product", render: (l) => productById(l.productId)?.name || l.productId },
          { key: "warehouse", label: "Location", render: (l) => warehouseName(l.warehouse) },
          {
            key: "change",
            label: "Quantity",
            align: "right",
            render: (l) => (
              <span className={l.change >= 0 ? "text-success" : "text-danger"}>
                {l.change >= 0 ? "+" : ""}
                {l.change}
              </span>
            ),
          },
        ]}
        rows={rows}
        emptyLabel="No movement recorded yet."
      />
    </div>
  );
}
