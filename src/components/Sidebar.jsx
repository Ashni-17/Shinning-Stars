import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  Package,
  Truck,
  PackageCheck,
  ArrowLeftRight,
  ClipboardList,
  History,
  Warehouse,
} from "lucide-react";

const NAV = [
  {
    section: "Overview",
    items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutGrid }],
  },
  {
    section: "Catalog",
    items: [{ to: "/products", label: "Products", icon: Package }],
  },
  {
    section: "Operations",
    items: [
      { to: "/receipts", label: "Receipts", icon: PackageCheck },
      { to: "/deliveries", label: "Deliveries", icon: Truck },
      { to: "/transfers", label: "Internal transfers", icon: ArrowLeftRight },
    ],
  },
  {
    section: "Inventory",
    items: [
      { to: "/adjustments", label: "Adjustments", icon: ClipboardList },
      { to: "/history", label: "Move history", icon: History },
    ],
  },
  {
    section: "Settings",
    items: [{ to: "/settings/warehouse", label: "Warehouses", icon: Warehouse }],
  },
];

export default function Sidebar() {
  return (
    <aside className="w-60 shrink-0 bg-surface border-r border-border h-screen sticky top-0 flex flex-col">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="1" y="7" width="20" height="14" fill="none" stroke="#E8A33D" strokeWidth="1.6" />
          <path d="M1 7L11 1L21 7" stroke="#E8A33D" strokeWidth="1.6" strokeLinejoin="round" />
          <line x1="11" y1="7" x2="11" y2="21" stroke="#E8A33D" strokeWidth="1.2" opacity="0.6" />
        </svg>
        <span className="font-display text-xl tracking-wide">StockSense</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {NAV.map((group) => (
          <div key={group.section} className="mb-5">
            <p className="px-5 text-xs text-dim mb-1.5">{group.section}</p>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-5 py-2 text-sm border-l-[3px] transition-colors ${
                    isActive
                      ? "border-l-accent bg-surface2 text-text"
                      : "border-l-transparent text-muted hover:text-text hover:bg-surface2/60"
                  }`
                }
              >
                <item.icon size={17} strokeWidth={1.8} />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-border text-xs text-dim">
        StockSense v1.0 &middot; Frontend demo
      </div>
    </aside>
  );
}
