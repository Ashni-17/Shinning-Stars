import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import SearchBar from "../../components/SearchBar";
import FilterBar from "../../components/FilterBar";
import DataTable from "../../components/DataTable";
import Button from "../../components/Button";
import { listProducts, totalStock, isLowStock, isOutOfStock } from "../../services/productService";
import { CATEGORIES } from "../../utils/constants";

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});

  useEffect(() => {
    listProducts().then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  const rows = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !filters.category || p.category === filters.category;
      const matchesAvailability =
        !filters.availability ||
        (filters.availability === "low" && isLowStock(p) && !isOutOfStock(p)) ||
        (filters.availability === "out" && isOutOfStock(p)) ||
        (filters.availability === "ok" && !isLowStock(p));
      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [products, search, filters]);

  return (
    <div>
      <PageHeader
        title="Products"
        description="Every SKU you track, with stock availability across all locations."
        actions={
          <Button icon={Plus} onClick={() => navigate("/products/new")}>
            Add product
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3 mb-4">
        <SearchBar value={search} onChange={setSearch} />
        <FilterBar
          filters={[
            { key: "category", label: "Category", options: CATEGORIES.map((c) => ({ value: c, label: c })) },
            {
              key: "availability",
              label: "Availability",
              options: [
                { value: "ok", label: "In stock" },
                { value: "low", label: "Low stock" },
                { value: "out", label: "Out of stock" },
              ],
            },
          ]}
          active={filters}
          onChange={(key, value) => setFilters((f) => ({ ...f, [key]: value }))}
        />
      </div>

      {!loading && (
        <DataTable
          columns={[
            { key: "name", label: "Product" },
            { key: "sku", label: "SKU" },
            { key: "category", label: "Category" },
            {
              key: "stock",
              label: "In stock",
              align: "right",
              render: (p) => {
                const t = totalStock(p);
                const tone = isOutOfStock(p) ? "text-danger" : isLowStock(p) ? "text-accent" : "text-text";
                return (
                  <span className={tone}>
                    {t} {p.uom}
                  </span>
                );
              },
            },
            { key: "reorderPoint", label: "Reorder point", align: "right" },
          ]}
          rows={rows}
          onRowClick={(p) => navigate(`/products/${p.id}/edit`)}
        />
      )}
    </div>
  );
}
