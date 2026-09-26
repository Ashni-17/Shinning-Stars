import { AlertTriangle } from "lucide-react";

export default function AlertCard({ title, message, action }) {
  return (
    <div className="flex items-stretch bg-surface border border-border overflow-hidden">
      <div className="w-1.5 hazard-stripe shrink-0" />
      <div className="flex items-start gap-3 px-4 py-3 flex-1">
        <AlertTriangle size={18} className="text-accent shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-text">{title}</p>
          {message && <p className="text-sm text-muted mt-0.5">{message}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}
