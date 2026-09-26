import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import Button from "../../components/Button";
import StatusBadge from "../../components/StatusBadge";
import DataTable from "../../components/DataTable";
import { getTransfer, validateTransfer, setTransferStatus } from "../../services/transferService";
import { getCollection } from "../../services/api";
import { WAREHOUSES } from "../../utils/constants";

export default function TransferDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transfer, setTransfer] = useState(null);
  const [working, setWorking] = useState(false);
  const products = getCollection("products");

  useEffect(() => {
    getTransfer(id).then((t) => {
      if (!t) return navigate("/transfers");
      setTransfer(t);
    });
  }, [id, navigate]);

  async function handleValidate() {
    setWorking(true);
    const updated = await validateTransfer(id);
    setTransfer(updated);
    setWorking(false);
  }

  async function handleCancel() {
    setWorking(true);
    const updated = await setTransferStatus(id, "Canceled");
    setTransfer(updated);
    setWorking(false);
  }

  if (!transfer) return null;

  const productById = (pid) => products.find((p) => p.id === pid);
  const fromName = WAREHOUSES.find((w) => w.id === transfer.from)?.name || transfer.from;
  const toName = WAREHOUSES.find((w) => w.id === transfer.to)?.name || transfer.to;
  const canAct = transfer.status !== "Done" && transfer.status !== "Canceled";

  return (
    <div className="max-w-3xl">
      <button onClick={() => navigate("/transfers")} className="flex items-center gap-1.5 text-sm text-muted hover:text-text mb-4">
        <ArrowLeft size={15} /> Back to transfers
      </button>
      <PageHeader
        title={transfer.id}
        description={`${fromName} → ${toName} · ${transfer.date}`}
        actions={
          canAct && (
            <>
              <Button variant="danger" onClick={handleCancel} disabled={working}>Cancel</Button>
              <Button icon={Check} onClick={handleValidate} disabled={working}>
                {working ? "Validating…" : "Validate transfer"}
              </Button>
            </>
          )
        }
      />
      <div className="mb-4">
        <StatusBadge status={transfer.status} />
      </div>
      <DataTable
        columns={[
          { key: "product", label: "Product", render: (l) => productById(l.productId)?.name || l.productId },
          { key: "sku", label: "SKU", render: (l) => productById(l.productId)?.sku },
          { key: "qty", label: "Quantity", align: "right", render: (l) => `${l.qty} ${productById(l.productId)?.uom || ""}` },
        ]}
        rows={transfer.lines}
      />
      {transfer.status === "Done" && (
        <p className="text-sm text-success mt-4">Stock moved from {fromName} to {toName} and logged in the ledger.</p>
      )}
    </div>
  );
}
