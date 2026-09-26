import { Plus, Trash2 } from "lucide-react";
import Button from "./Button";

const cellInput = "w-full bg-surface2 border border-border px-2.5 py-2 text-sm outline-none focus:border-accent";

// Generic editable line-item table used by Create Receipt/Delivery/Transfer/Adjustment.
// fields: [{ key, label, type: 'product' | 'number', width }]
export default function LineItemsEditor({ fields, lines, onChange, products, emptyLine }) {
  function updateLine(idx, key, value) {
    const next = lines.map((l, i) => (i === idx ? { ...l, [key]: value } : l));
    onChange(next);
  }

  function addLine() {
    onChange([...lines, { ...emptyLine }]);
  }

  function removeLine(idx) {
    onChange(lines.filter((_, i) => i !== idx));
  }

  return (
    <div className="border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted">
            {fields.map((f) => (
              <th key={f.key} className="font-normal px-3 py-2">{f.label}</th>
            ))}
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {lines.map((line, idx) => (
            <tr key={idx} className="border-b border-border/60 last:border-0">
              {fields.map((f) => (
                <td key={f.key} className="px-3 py-2">
                  {f.type === "product" ? (
                    <select
                      className={cellInput}
                      value={line[f.key] || ""}
                      onChange={(e) => updateLine(idx, f.key, e.target.value)}
                    >
                      <option value="">Select product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} · {p.sku}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      className={cellInput}
                      value={line[f.key] ?? ""}
                      onChange={(e) => updateLine(idx, f.key, e.target.value)}
                    />
                  )}
                </td>
              ))}
              <td className="px-2">
                <button type="button" onClick={() => removeLine(idx)} className="text-dim hover:text-danger">
                  <Trash2 size={15} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-3 py-2 border-t border-border">
        <Button type="button" variant="ghost" size="sm" icon={Plus} onClick={addLine}>
          Add line
        </Button>
      </div>
    </div>
  );
}
