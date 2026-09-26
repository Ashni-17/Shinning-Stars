import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import Button from "../../components/Button";
import StatusBadge from "../../components/StatusBadge";
import DataTable from "../../components/DataTable";
import { getDelivery, validateDelivery, setDeliveryStatus } from "../../services/deliveryService";
import { getCollection } from "../../services/api";
import { WAREHOUSES } from "../../utils/constants";

export default function DeliveryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState(null);
  const [working, setWorking] = useState(false);
  const products = getCollection("products");

  useEffect(() => {
    getDelivery(id).then((d) => {
      if (!d) return navigate("/deliveries");
      setDelivery(d);
    });
  }, [id, navigate]);

  async function handleValidate() {
    setWorking(true);
    const updated = await validateDelivery(id);
    setDelivery(updated);
    setWorking(false);
  }

  async function handleCancel() {
    setWorking(true);
    const updated = await setDeliveryStatus(id, "Canceled");
    setDelivery(updated);
    setWorking(false);
  }

  if (!delivery) return null;

  const productById = (pid) => products.find((p) => p.id === pid);
  const warehouseName = WAREHOUSES.find((w) => w.id === delivery.warehouse)?.name || delivery.warehouse;
  const canAct = delivery.status !== "Done" && delivery.status !== "Canceled";

  return (
    <div className="max-w-3xl">
      <button onClick={() => navigate("/deliveries")} className="flex items-center gap-1.5 text-sm text-muted hover:text-text mb-4">
        <ArrowLeft size={15} /> Back to deliveries
      </button>
      <PageHeader
        title={delivery.id}
        description={`To ${delivery.customer} · from ${warehouseName} · ${delivery.date}`}
        actions={
          canAct && (
            <>
              <Button variant="danger" onClick={handleCancel} disabled={working}>Cancel</Button>
              <Button icon={Check} onClick={handleValidate} disabled={working}>
                {working ? "Validating…" : "Validate delivery"}
              </Button>
            </>
          )
        }
      />
      <div className="mb-4">
        <StatusBadge status={delivery.status} />
      </div>
      <DataTable
        columns={[
          { key: "product", label: "Product", render: (l) => productById(l.productId)?.name || l.productId },
          { key: "sku", label: "SKU", render: (l) => productById(l.productId)?.sku },
          { key: "qty", label: "Quantity", align: "right", render: (l) => `${l.qty} ${productById(l.productId)?.uom || ""}` },
        ]}
        rows={delivery.lines}
      />
      {delivery.status === "Done" && (
        <p className="text-sm text-success mt-4">Stock has been removed from {warehouseName} and logged in the ledger.</p>
      )}
    </div>
  );
}
