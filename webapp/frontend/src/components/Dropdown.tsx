import { useEffect, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";

interface DropdownProps {
  icon?: ReactNode;
  label: ReactNode;
  width?: number;
  align?: "left" | "right";
  children: (close: () => void) => ReactNode;
}

export function Dropdown({ icon, label, width = 280, align = "left", children }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          "flex items-center gap-2 whitespace-nowrap rounded-xl border px-3.5 py-2 text-sm transition-colors",
          open
            ? "border-white/20 bg-white/10 text-[var(--color-text-primary)]"
            : "border-white/10 bg-white/5 text-[var(--color-text-secondary)] hover:border-white/15 hover:bg-white/[0.08] hover:text-[var(--color-text-primary)]",
        )}
      >
        {icon}
        {label}
        <ChevronDown size={14} className={clsx("text-[var(--color-text-muted)] transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div
          className={clsx(
            "panel-solid absolute z-50 mt-2 rounded-2xl p-3 shadow-2xl shadow-black/50",
            align === "right" ? "right-0" : "left-0",
          )}
          style={{ width }}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
