const VARIANTS = {
  primary: "bg-accent text-bg hover:bg-accentDark",
  ghost: "bg-transparent text-text border border-border hover:border-borderLight",
  subtle: "bg-surface2 text-text hover:bg-surface3",
  danger: "bg-transparent text-danger border border-danger/40 hover:bg-danger/10",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  className = "",
  type = "button",
  ...props
}) {
  const sizes = {
    sm: "text-sm px-3 py-1.5 gap-1.5",
    md: "text-sm px-4 py-2.5 gap-2",
    lg: "text-base px-5 py-3 gap-2",
  };
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${VARIANTS[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={16} strokeWidth={2} />}
      {children}
    </button>
  );
}
