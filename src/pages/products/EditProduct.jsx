import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import Button from "../../components/Button";
import { getProduct, updateProduct } from "../../services/productService";
import { CATEGORIES, UNITS, WAREHOUSES } from "../../utils/constants";
import { isRequired, isPositiveNumber } from "../../utils/validation";

const inputClass =
  "w-full bg-surface2 border border-border px-3.5 py-2.5 text-sm outline-none focus:border-accent placeholder:text-dim";
const labelClass = "text-sm text-muted block mb-1.5";

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProduct(id).then((p) => {
      if (!p) return navigate("/products");
      setForm(p);
    });
  }, [id, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!isRequired(form.name)) return setError("Product name is required.");
    if (!isPositiveNumber(form.reorderPoint)) return setError("Reorder point must be a number.");
    setSaving(true);
    try {
      await updateProduct(id, form);
      navigate("/products");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!form) return null;

  return (
    <div className="max-w-xl">
      <PageHeader title="Edit product" description={`Editing ${form.sku}`} />
      <form onSubmit={handleSubmit} className="space-y-4 bg-surface border border-border p-6">
        {error && <p className="text-sm text-danger bg-danger/10 border border-danger/30 px-3 py-2">{error}</p>}
        <div>
          <label className={labelClass}>Product name</label>
          <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>SKU / code</label>
            <input className={inputClass} value={form.sku} disabled />
          </div>
          <div>
            <label className={labelClass}>Unit of measure</label>
            <select className={inputClass} value={form.uom} onChange={(e) => setForm({ ...form, uom: e.target.value })}>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Category</label>
          <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Reorder point</label>
          <input type="number" min="0" className={inputClass} value={form.reorderPoint} onChange={(e) => setForm({ ...form, reorderPoint: e.target.value })} />
        </div>

        <div>
          <p className={labelClass}>Stock by location</p>
          <div className="border border-border divide-y divide-border">
            {WAREHOUSES.map((w) => (
              <div key={w.id} className="flex items-center justify-between px-3.5 py-2.5 text-sm">
                <span className="text-muted">{w.name}</span>
                <span className="tabular">{form.stock[w.id] || 0} {form.uom}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-dim mt-1.5">Adjust per-location stock from Inventory → Adjustments.</p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={() => navigate("/products")}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </div>
      </form>
    </div>
  );
}
