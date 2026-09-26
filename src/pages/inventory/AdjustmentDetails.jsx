import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import Button from "../../components/Button";
import StatusBadge from "../../components/StatusBadge";
import DataTable from "../../components/DataTable";
import { getAdjustment, applyAdjustment } from "../../services/adjustmentService";
import { getCollection } from "../../services/api";
import { WAREHOUSES } from "../../utils/constants";

export default function AdjustmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [adjustment, setAdjustment] = useState(null);
  const [working, setWorking] = useState(false);
  const products = getCollection("products");

  useEffect(() => {
    getAdjustment(id).then((a) => {
      if (!a) return navigate("/adjustments");
      setAdjustment(a);
    });
  }, [id, navigate]);

  async function handleApply() {
    setWorking(true);
    const updated = await applyAdjustment(id);
    setAdjustment(updated);
    setWorking(false);
  }

  if (!adjustment) return null;

  const productById = (pid) => products.find((p) => p.id === pid);
  const warehouseName = WAREHOUSES.find((w) => w.id === adjustment.warehouse)?.name || adjustment.warehouse;
  const canAct = adjustment.status !== "Done";

  return (
    <div className="max-w-3xl">
      <button onClick={() => navigate("/adjustments")} className="flex items-center gap-1.5 text-sm text-muted hover:text-text mb-4">
        <ArrowLeft size={15} /> Back to adjustments
      </button>
      <PageHeader
        title={adjustment.id}
        description={`${warehouseName} · ${adjustment.reason} · ${adjustment.date}`}
        actions={
          canAct && (
            <Button icon={Check} onClick={handleApply} disabled={working}>
              {working ? "Applying…" : "Apply adjustment"}
            </Button>
          )
        }
      />
      <div className="mb-4">
        <StatusBadge status={adjustment.status} />
      </div>
      <DataTable
        columns={[
          { key: "product", label: "Product", render: (l) => productById(l.productId)?.name || l.productId },
          { key: "expected", label: "Recorded", align: "right" },
          { key: "counted", label: "Counted", align: "right" },
          {
            key: "delta",
            label: "Change",
            align: "right",
            render: (l) => {
              const d = l.counted - l.expected;
              return <span className={d >= 0 ? "text-success" : "text-danger"}>{d >= 0 ? "+" : ""}{d}</span>;
            },
          },
        ]}
        rows={adjustment.lines}
      />
      {adjustment.status === "Done" && (
        <p className="text-sm text-success mt-4">Stock at {warehouseName} now matches the physical count and is logged in the ledger.</p>
      )}
    </div>
  );
}
