import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import Button from "../../components/Button";
import LineItemsEditor from "../../components/LineItemsEditor";
import { createTransfer } from "../../services/transferService";
import { listProducts } from "../../services/productService";
import { WAREHOUSES } from "../../utils/constants";

const inputClass =
  "w-full bg-surface2 border border-border px-3.5 py-2.5 text-sm outline-none focus:border-accent placeholder:text-dim";
const labelClass = "text-sm text-muted block mb-1.5";

export default function CreateTransfer() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [from, setFrom] = useState(WAREHOUSES[0].id);
  const [to, setTo] = useState(WAREHOUSES[1]?.id || WAREHOUSES[0].id);
  const [lines, setLines] = useState([{ productId: "", qty: "" }]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listProducts().then(setProducts);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (from === to) return setError("Source and destination must be different.");
    const validLines = lines.filter((l) => l.productId && Number(l.qty) > 0);
    if (!validLines.length) return setError("Add at least one product with a quantity.");
    setSaving(true);
    try {
      await createTransfer({ from, to, lines: validLines });
      navigate("/transfers");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="New internal transfer" description="Move stock between two locations." />
      <form onSubmit={handleSubmit} className="space-y-4 bg-surface border border-border p-6">
        {error && <p className="text-sm text-danger bg-danger/10 border border-danger/30 px-3 py-2">{error}</p>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>From</label>
            <select className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)}>
              {WAREHOUSES.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>To</label>
            <select className={inputClass} value={to} onChange={(e) => setTo(e.target.value)}>
              {WAREHOUSES.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Products to move</label>
          <LineItemsEditor
            products={products}
            fields={[
              { key: "productId", label: "Product", type: "product" },
              { key: "qty", label: "Quantity", type: "number" },
            ]}
            lines={lines}
            onChange={setLines}
            emptyLine={{ productId: "", qty: "" }}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={() => navigate("/transfers")}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save draft"}</Button>
        </div>
      </form>
    </div>
  );
}
