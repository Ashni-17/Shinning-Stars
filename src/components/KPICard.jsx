const TONE_BORDER = {
  neutral: "border-l-borderLight",
  accent: "border-l-accent",
  danger: "border-l-danger",
  info: "border-l-info",
  success: "border-l-success",
};

export default function KPICard({ label, value, tone = "neutral", suffix }) {
  return (
    <div className={`bg-surface border border-border border-l-[3px] ${TONE_BORDER[tone]} px-5 py-4`}>
      <p className="text-sm text-muted">{label}</p>
      <p className="font-display text-4xl leading-none mt-2 tabular">
        {value}
        {suffix && <span className="text-lg text-muted ml-1">{suffix}</span>}
      </p>
    </div>
  );
}
