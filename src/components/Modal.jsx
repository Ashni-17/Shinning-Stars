import { X } from "lucide-react";
import { useEffect } from "react";

export default function Modal({ open, onClose, title, children, footer, wide }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className={`bg-surface border border-borderLight w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[85vh] flex flex-col`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-display text-2xl">{title}</h2>
          <button onClick={onClose} className="text-muted hover:text-text" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-border flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
