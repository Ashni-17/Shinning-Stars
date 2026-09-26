import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import KPICard from "../../components/KPICard";
import AlertCard from "../../components/AlertCard";
import DataTable from "../../components/DataTable";
import Button from "../../components/Button";
import { getKpis, getLowStockProducts, getRecentActivity } from "../../services/dashboardService";
import { getCollection } from "../../services/api";
import { totalStock } from "../../services/productService";
import { WAREHOUSES } from "../../utils/constants";

export default function Dashboard() {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [activity, setActivity] = useState([]);
  const products = getCollection("products");

  useEffect(() => {
    getKpis().then(setKpis);
    getLowStockProducts().then(setLowStock);
    getRecentActivity(7).then(setActivity);
  }, []);

  const productById = (id) => products.find((p) => p.id === id);
  const warehouseName = (id) => WAREHOUSES.find((w) => w.id === id)?.name || id;

  return (
    <div>
      <PageHeader
        title="Inventory overview"
        description="A live snapshot of stock, movements, and pending work across your warehouses."
        actions={
          <>
            <Button variant="ghost" onClick={() => navigate("/receipts")}>
              New receipt
            </Button>
            <Button onClick={() => navigate("/deliveries")}>New delivery</Button>
          </>
        }
      />

      {!kpis ? (
        <div className="h-24" />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-8">
          <KPICard label="Products in stock" value={kpis.totalProducts} />
          <KPICard label="Low stock" value={kpis.lowStock} tone="accent" />
          <KPICard label="Out of stock" value={kpis.outOfStock} tone="danger" />
          <KPICard label="Pending receipts" value={kpis.pendingReceipts} tone="info" />
          <KPICard label="Pending deliveries" value={kpis.pendingDeliveries} tone="info" />
          <KPICard label="Transfers scheduled" value={kpis.scheduledTransfers} tone="success" />
        </div>
      )}

      {lowStock.length > 0 && (
        <div className="mb-8 space-y-2">
          {lowStock.slice(0, 3).map((p) => (
            <AlertCard
              key={p.id}
              title={`${p.name} is running low`}
              message={`${p.total} ${p.uom} left across all warehouses — reorder point is ${p.reorderPoint} ${p.uom}.`}
              action={
                <Button size="sm" variant="ghost" onClick={() => navigate("/products")}>
                  View product
                </Button>
              }
            />
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <h2 className="font-display text-2xl mb-3">Recent stock movement</h2>
          <DataTable
            columns={[
              { key: "date", label: "Date" },
              { key: "ref", label: "Reference" },
              { key: "type", label: "Type" },
              {
                key: "product",
                label: "Product",
                render: (r) => productById(r.productId)?.name || r.productId,
              },
              { key: "warehouse", label: "Location", render: (r) => warehouseName(r.warehouse) },
              {
                key: "change",
                label: "Change",
                align: "right",
                render: (r) => (
                  <span className={r.change >= 0 ? "text-success" : "text-danger"}>
                    {r.change >= 0 ? "+" : ""}
                    {r.change}
                  </span>
                ),
              },
            ]}
            rows={activity}
            emptyLabel="No stock movement yet."
          />
        </div>

        <div className="lg:col-span-2">
          <h2 className="font-display text-2xl mb-3">Low stock watchlist</h2>
          <DataTable
            columns={[
              { key: "name", label: "Product" },
              {
                key: "total",
                label: "In stock",
                align: "right",
                render: (r) => `${totalStock(r)} ${r.uom}`,
              },
              { key: "reorderPoint", label: "Reorder at", align: "right" },
            ]}
            rows={lowStock}
            onRowClick={() => navigate("/products")}
            emptyLabel="Everything is above its reorder point."
          />
        </div>
      </div>
    </div>
  );
}
