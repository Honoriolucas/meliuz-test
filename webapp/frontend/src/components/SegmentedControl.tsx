import clsx from "clsx";

interface SegmentedControlProps<T extends string> {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md";
}

export function SegmentedControl<T extends string>({ options, value, onChange, size = "md" }: SegmentedControlProps<T>) {
  return (
    <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={clsx(
            "rounded-lg font-medium transition-colors",
            size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
            value === opt
              ? "bg-[var(--color-blue)] text-white shadow-sm shadow-black/30"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]",
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
