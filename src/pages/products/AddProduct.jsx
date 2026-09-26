import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import Button from "../../components/Button";
import { createProduct } from "../../services/productService";
import { CATEGORIES, UNITS } from "../../utils/constants";
import { isRequired, isPositiveNumber } from "../../utils/validation";

const inputClass =
  "w-full bg-surface2 border border-border px-3.5 py-2.5 text-sm outline-none focus:border-accent placeholder:text-dim";
const labelClass = "text-sm text-muted block mb-1.5";

export default function AddProduct() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: CATEGORIES[0],
    uom: UNITS[0],
    reorderPoint: "",
    initialStock: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!isRequired(form.name)) return setError("Product name is required.");
    if (!isRequired(form.sku)) return setError("SKU / code is required.");
    if (!isPositiveNumber(form.reorderPoint || 0)) return setError("Reorder point must be a number.");
    setSaving(true);
    try {
      await createProduct(form);
      navigate("/products");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="Add product" description="Create a new SKU in your catalog." />
      <form onSubmit={handleSubmit} className="space-y-4 bg-surface border border-border p-6">
        {error && <p className="text-sm text-danger bg-danger/10 border border-danger/30 px-3 py-2">{error}</p>}
        <div>
          <label className={labelClass}>Product name</label>
          <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Steel Rods 12mm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>SKU / code</label>
            <input className={inputClass} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })} placeholder="STL-ROD-12" />
          </div>
          <div>
            <label className={labelClass}>Unit of measure</label>
            <select className={inputClass} value={form.uom} onChange={(e) => setForm({ ...form, uom: e.target.value })}>
              {UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Category</label>
          <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Reorder point</label>
            <input type="number" min="0" className={inputClass} value={form.reorderPoint} onChange={(e) => setForm({ ...form, reorderPoint: e.target.value })} placeholder="0" />
          </div>
          <div>
            <label className={labelClass}>Initial stock (optional)</label>
            <input type="number" min="0" className={inputClass} value={form.initialStock} onChange={(e) => setForm({ ...form, initialStock: e.target.value })} placeholder="0" />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={() => navigate("/products")}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save product"}</Button>
        </div>
      </form>
    </div>
  );
}
