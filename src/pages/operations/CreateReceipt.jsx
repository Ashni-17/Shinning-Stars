import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import Button from "../../components/Button";
import LineItemsEditor from "../../components/LineItemsEditor";
import { createReceipt } from "../../services/receiptService";
import { listProducts } from "../../services/productService";
import { WAREHOUSES } from "../../utils/constants";
import { isRequired } from "../../utils/validation";

const inputClass =
  "w-full bg-surface2 border border-border px-3.5 py-2.5 text-sm outline-none focus:border-accent placeholder:text-dim";
const labelClass = "text-sm text-muted block mb-1.5";

export default function CreateReceipt() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [supplier, setSupplier] = useState("");
  const [warehouse, setWarehouse] = useState(WAREHOUSES[0].id);
  const [lines, setLines] = useState([{ productId: "", qty: "" }]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listProducts().then(setProducts);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!isRequired(supplier)) return setError("Enter the supplier name.");
    const validLines = lines.filter((l) => l.productId && Number(l.qty) > 0);
    if (!validLines.length) return setError("Add at least one product with a quantity.");
    setSaving(true);
    try {
      await createReceipt({ supplier, warehouse, lines: validLines });
      navigate("/receipts");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="New receipt" description="Record incoming stock from a supplier." />
      <form onSubmit={handleSubmit} className="space-y-4 bg-surface border border-border p-6">
        {error && <p className="text-sm text-danger bg-danger/10 border border-danger/30 px-3 py-2">{error}</p>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Supplier</label>
            <input className={inputClass} value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="e.g. Sundaram Steel Co." />
          </div>
          <div>
            <label className={labelClass}>Destination warehouse</label>
            <select className={inputClass} value={warehouse} onChange={(e) => setWarehouse(e.target.value)}>
              {WAREHOUSES.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Products received</label>
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
        <p className="text-xs text-dim">Receipts save as a draft. Validate from the receipt details page to increase stock.</p>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={() => navigate("/receipts")}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save draft"}</Button>
        </div>
      </form>
    </div>
  );
}
