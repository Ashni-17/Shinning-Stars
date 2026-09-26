import { Search } from "lucide-react";

export default function SearchBar({ value, onChange, placeholder = "Search by name or SKU" }) {
  return (
    <div className="flex items-center gap-2 bg-surface2 border border-border px-3 py-2 flex-1 max-w-md focus-within:border-accent">
      <Search size={16} className="text-dim shrink-0" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent outline-none text-sm w-full placeholder:text-dim"
      />
    </div>
  );
}
