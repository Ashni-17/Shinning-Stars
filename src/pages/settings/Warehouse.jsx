import { useEffect, useState } from "react";
import { Plus, Warehouse as WarehouseIcon } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import { listWarehouses, createWarehouse, updateWarehouse } from "../../services/warehouseService";
import { isRequired } from "../../utils/validation";

const inputClass =
  "w-full bg-surface2 border border-border px-3.5 py-2.5 text-sm outline-none focus:border-accent placeholder:text-dim";
const labelClass = "text-sm text-muted block mb-1.5";

export default function Warehouse() {
  const [warehouses, setWarehouses] = useState([]);
  const [modal, setModal] = useState(null); // null | { mode: 'new' | 'edit', data }
  const [form, setForm] = useState({ name: "", location: "", manager: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  function refresh() {
    listWarehouses().then(setWarehouses);
  }

  function openNew() {
    setForm({ name: "", location: "", manager: "" });
    setError("");
    setModal({ mode: "new" });
  }

  function openEdit(w) {
    setForm(w);
    setError("");
    setModal({ mode: "edit", id: w.id });
  }

  async function handleSave() {
    setError("");
    if (!isRequired(form.name)) return setError("Warehouse name is required.");
    if (!isRequired(form.location)) return setError("Location is required.");
    setSaving(true);
    try {
      if (modal.mode === "new") {
        await createWarehouse(form);
      } else {
        await updateWarehouse(modal.id, form);
      }
      setModal(null);
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Warehouses"
        description="Locations stock can be received into, delivered from, and transferred between."
        actions={<Button icon={Plus} onClick={openNew}>Add warehouse</Button>}
      />

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {warehouses.map((w) => (
          <button
            key={w.id}
            onClick={() => openEdit(w)}
            className="text-left bg-surface border border-border p-5 hover:border-accent transition-colors"
          >
            <div className="flex items-center gap-2 text-accent mb-3">
              <WarehouseIcon size={18} />
              <span className="font-display text-xl">{w.name}</span>
            </div>
            <p className="text-sm text-muted">{w.location}</p>
            <p className="text-sm text-dim mt-1">Managed by {w.manager}</p>
          </button>
        ))}
      </div>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === "new" ? "Add warehouse" : "Edit warehouse"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          {error && <p className="text-sm text-danger bg-danger/10 border border-danger/30 px-3 py-2">{error}</p>}
          <div>
            <label className={labelClass}>Name</label>
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Warehouse 3" />
          </div>
          <div>
            <label className={labelClass}>Location</label>
            <input className={inputClass} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Madurai, TN" />
          </div>
          <div>
            <label className={labelClass}>Manager</label>
            <input className={inputClass} value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} placeholder="e.g. Priya N" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
