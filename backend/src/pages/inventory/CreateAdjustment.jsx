import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import Button from "../../components/Button";
import { createAdjustment } from "../../services/adjustmentService";
import { listProducts } from "../../services/productService";
import { WAREHOUSES } from "../../utils/constants";
import { isRequired } from "../../utils/validation";

const inputClass =
  "w-full bg-surface2 border border-border px-3.5 py-2.5 text-sm outline-none focus:border-accent placeholder:text-dim";
const cellInput = "w-full bg-surface2 border border-border px-2.5 py-2 text-sm outline-none focus:border-accent";
const labelClass = "text-sm text-muted block mb-1.5";

export default function CreateAdjustment() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [warehouse, setWarehouse] = useState(WAREHOUSES[0].id);
  const [reason, setReason] = useState("");
  const [lines, setLines] = useState([{ productId: "", counted: "" }]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listProducts().then(setProducts);
  }, []);

  function expectedFor(productId) {
    const p = products.find((pr) => pr.id === productId);
    return p ? p.stock[warehouse] || 0 : 0;
  }

  function updateLine(idx, key, value) {
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, [key]: value } : l)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!isRequired(reason)) return setError("Enter a reason for this adjustment.");
    const validLines = lines
      .filter((l) => l.productId && l.counted !== "")
      .map((l) => ({ productId: l.productId, counted: Number(l.counted), expected: expectedFor(l.productId) }));
    if (!validLines.length) return setError("Select at least one product and enter a counted quantity.");
    setSaving(true);
    try {
      await createAdjustment({ warehouse, reason, lines: validLines });
      navigate("/adjustments");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="New stock adjustment" description="Select a location, then enter the physically counted quantity." />
      <form onSubmit={handleSubmit} className="space-y-4 bg-surface border border-border p-6">
        {error && <p className="text-sm text-danger bg-danger/10 border border-danger/30 px-3 py-2">{error}</p>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Location</label>
            <select className={inputClass} value={warehouse} onChange={(e) => setWarehouse(e.target.value)}>
              {WAREHOUSES.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Reason</label>
            <input className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Physical count, Damaged goods" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Counted quantities</label>
          <div className="border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="font-normal px-3 py-2">Product</th>
                  <th className="font-normal px-3 py-2 text-right">Recorded</th>
                  <th className="font-normal px-3 py-2 text-right">Counted</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={idx} className="border-b border-border/60 last:border-0">
                    <td className="px-3 py-2">
                      <select className={cellInput} value={line.productId} onChange={(e) => updateLine(idx, "productId", e.target.value)}>
                        <option value="">Select product</option>
                        {products.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.sku}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-right tabular text-muted">{line.productId ? expectedFor(line.productId) : "—"}</td>
                    <td className="px-3 py-2">
                      <input type="number" min="0" className={cellInput + " text-right"} value={line.counted} onChange={(e) => updateLine(idx, "counted", e.target.value)} />
                    </td>
                    <td className="px-2">
                      <button type="button" onClick={() => setLines((ls) => ls.filter((_, i) => i !== idx))} className="text-dim hover:text-danger">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-3 py-2 border-t border-border">
              <Button type="button" variant="ghost" size="sm" icon={Plus} onClick={() => setLines((ls) => [...ls, { productId: "", counted: "" }])}>
                Add line
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={() => navigate("/adjustments")}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save draft"}</Button>
        </div>
      </form>
    </div>
  );
}
