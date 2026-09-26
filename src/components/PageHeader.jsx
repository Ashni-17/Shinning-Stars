export default function PageHeader({ title, description, actions }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
      <div>
        <h1 className="font-display text-3xl leading-tight">{title}</h1>
        {description && <p className="text-sm text-muted mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
