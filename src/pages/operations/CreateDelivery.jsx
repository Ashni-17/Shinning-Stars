import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import Button from "../../components/Button";
import LineItemsEditor from "../../components/LineItemsEditor";
import { createDelivery } from "../../services/deliveryService";
import { listProducts } from "../../services/productService";
import { WAREHOUSES } from "../../utils/constants";
import { isRequired } from "../../utils/validation";

const inputClass =
  "w-full bg-surface2 border border-border px-3.5 py-2.5 text-sm outline-none focus:border-accent placeholder:text-dim";
const labelClass = "text-sm text-muted block mb-1.5";

export default function CreateDelivery() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [customer, setCustomer] = useState("");
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
    if (!isRequired(customer)) return setError("Enter the customer name.");
    const validLines = lines.filter((l) => l.productId && Number(l.qty) > 0);
    if (!validLines.length) return setError("Add at least one product with a quantity.");
    setSaving(true);
    try {
      await createDelivery({ customer, warehouse, lines: validLines });
      navigate("/deliveries");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="New delivery order" description="Record outgoing stock for a customer shipment." />
      <form onSubmit={handleSubmit} className="space-y-4 bg-surface border border-border p-6">
        {error && <p className="text-sm text-danger bg-danger/10 border border-danger/30 px-3 py-2">{error}</p>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Customer</label>
            <input className={inputClass} value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="e.g. Metro Retail" />
          </div>
          <div>
            <label className={labelClass}>Source warehouse</label>
            <select className={inputClass} value={warehouse} onChange={(e) => setWarehouse(e.target.value)}>
              {WAREHOUSES.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Products to ship</label>
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
        <p className="text-xs text-dim">Deliveries save as a draft. Validate from the order details page once picked and packed.</p>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={() => navigate("/deliveries")}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save draft"}</Button>
        </div>
      </form>
    </div>
  );
}
