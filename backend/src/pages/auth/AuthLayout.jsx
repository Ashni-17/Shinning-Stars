import { Boxes } from "lucide-react";

export default function AuthLayout({ eyebrow, title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-bg flex">
      <div className="hidden lg:flex flex-col justify-between w-[42%] bg-surface border-r border-border px-12 py-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 hazard-stripe" />
        <div className="flex items-center gap-2.5">
          <svg width="26" height="26" viewBox="0 0 22 22" fill="none">
            <rect x="1" y="7" width="20" height="14" fill="none" stroke="#E8A33D" strokeWidth="1.6" />
            <path d="M1 7L11 1L21 7" stroke="#E8A33D" strokeWidth="1.6" strokeLinejoin="round" />
            <line x1="11" y1="7" x2="11" y2="21" stroke="#E8A33D" strokeWidth="1.2" opacity="0.6" />
          </svg>
          <span className="font-display text-2xl tracking-wide">StockSense</span>
        </div>

        <div>
          <p className="text-accent text-sm mb-3">{eyebrow || "Inventory, in one ledger"}</p>
          <h1 className="font-display text-5xl leading-[1.05] max-w-sm">
            Every unit accounted for, every movement logged.
          </h1>
          <p className="text-muted mt-5 max-w-sm text-sm leading-relaxed">
            Receipts, deliveries, transfers and adjustments — StockSense keeps
            one running ledger of stock across every warehouse you run.
          </p>
        </div>

        <div className="flex items-center gap-3 text-sm text-muted">
          <Boxes size={16} className="text-dim" />
          Built for inventory managers and warehouse floor teams
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="1" y="7" width="20" height="14" fill="none" stroke="#E8A33D" strokeWidth="1.6" />
              <path d="M1 7L11 1L21 7" stroke="#E8A33D" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
            <span className="font-display text-xl">StockSense</span>
          </div>
          <h2 className="font-display text-3xl mb-1">{title}</h2>
          {subtitle && <p className="text-sm text-muted mb-7">{subtitle}</p>}
          {!subtitle && <div className="mb-7" />}
          {children}
        </div>
      </div>
    </div>
  );
}
