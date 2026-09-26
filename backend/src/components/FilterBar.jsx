export default function FilterBar({ filters, active, onChange }) {
  // filters: [{ key, label, options: [{value, label}] }]
  return (
    <div className="flex flex-wrap items-center gap-3">
      {filters.map((f) => (
        <select
          key={f.key}
          value={active[f.key] || ""}
          onChange={(e) => onChange(f.key, e.target.value)}
          className="bg-surface2 border border-border text-sm px-3 py-2 text-text outline-none focus:border-accent"
        >
          <option value="">{f.label}: All</option>
          {f.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}
