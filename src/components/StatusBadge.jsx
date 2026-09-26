import { STATUS_COLORS } from "../utils/constants";

const DOT = {
  dim: "bg-dim",
  accent: "bg-accent",
  info: "bg-info",
  success: "bg-success",
  danger: "bg-danger",
};

const TEXT = {
  dim: "text-muted",
  accent: "text-accent",
  info: "text-info",
  success: "text-success",
  danger: "text-danger",
};

export default function StatusBadge({ status }) {
  const tone = STATUS_COLORS[status] || "dim";
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[tone]}`} />
      <span className={TEXT[tone]}>{status}</span>
    </span>
  );
}
