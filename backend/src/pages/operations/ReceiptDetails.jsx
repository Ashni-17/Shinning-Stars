import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import Button from "../../components/Button";
import StatusBadge from "../../components/StatusBadge";
import DataTable from "../../components/DataTable";
import { getReceipt, validateReceipt, setReceiptStatus } from "../../services/receiptService";
import { getCollection } from "../../services/api";
import { WAREHOUSES } from "../../utils/constants";

export default function ReceiptDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState(null);
  const [working, setWorking] = useState(false);
  const products = getCollection("products");

  useEffect(() => {
    getReceipt(id).then((r) => {
      if (!r) return navigate("/receipts");
      setReceipt(r);
    });
  }, [id, navigate]);

  async function handleValidate() {
    setWorking(true);
    const updated = await validateReceipt(id);
    setReceipt(updated);
    setWorking(false);
  }

  async function handleCancel() {
    setWorking(true);
    const updated = await setReceiptStatus(id, "Canceled");
    setReceipt(updated);
    setWorking(false);
  }

  if (!receipt) return null;

  const productById = (pid) => products.find((p) => p.id === pid);
  const warehouseName = WAREHOUSES.find((w) => w.id === receipt.warehouse)?.name || receipt.warehouse;
  const canAct = receipt.status !== "Done" && receipt.status !== "Canceled";

  return (
    <div className="max-w-3xl">
      <button onClick={() => navigate("/receipts")} className="flex items-center gap-1.5 text-sm text-muted hover:text-text mb-4">
        <ArrowLeft size={15} /> Back to receipts
      </button>
      <PageHeader
        title={receipt.id}
        description={`From ${receipt.supplier} · into ${warehouseName} · ${receipt.date}`}
        actions={
          canAct && (
            <>
              <Button variant="danger" onClick={handleCancel} disabled={working}>Cancel</Button>
              <Button icon={Check} onClick={handleValidate} disabled={working}>
                {working ? "Validating…" : "Validate receipt"}
              </Button>
            </>
          )
        }
      />
      <div className="mb-4">
        <StatusBadge status={receipt.status} />
      </div>
      <DataTable
        columns={[
          { key: "product", label: "Product", render: (l) => productById(l.productId)?.name || l.productId },
          { key: "sku", label: "SKU", render: (l) => productById(l.productId)?.sku },
          { key: "qty", label: "Quantity received", align: "right", render: (l) => `${l.qty} ${productById(l.productId)?.uom || ""}` },
        ]}
        rows={receipt.lines}
      />
      {receipt.status === "Done" && (
        <p className="text-sm text-success mt-4">Stock has been added to {warehouseName} and logged in the ledger.</p>
      )}
    </div>
  );
}
