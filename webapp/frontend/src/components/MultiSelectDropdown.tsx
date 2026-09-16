import { Layers } from "lucide-react";
import { Dropdown } from "./Dropdown";

interface MultiSelectDropdownProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (vals: string[]) => void;
  extraAction?: { label: string; onClick: () => void };
}

export function MultiSelectDropdown({ label, options, selected, onChange, extraAction }: MultiSelectDropdownProps) {
  const allSelected = options.length > 0 && selected.length === options.length;
  const summary =
    options.length === 0
      ? "—"
      : selected.length === 0
        ? "Nenhum"
        : allSelected
          ? "Todos"
          : `${selected.length} de ${options.length}`;

  function toggle(opt: string) {
    if (selected.includes(opt)) onChange(selected.filter((s) => s !== opt));
    else onChange([...selected, opt]);
  }

  return (
    <Dropdown
      width={280}
      icon={<Layers size={14} className="text-[var(--color-text-muted)]" />}
      label={
        <span>
          <span className="text-[var(--color-text-muted)]">{label}: </span>
          <span className="font-medium">{summary}</span>
        </span>
      }
    >
      {() => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between px-1 pb-1.5">
            <button
              type="button"
              className="text-xs font-medium text-[var(--color-blue)] hover:underline"
              onClick={() => onChange(options)}
            >
              Selecionar todos
            </button>
            <button
              type="button"
              className="text-xs text-[var(--color-text-muted)] hover:underline"
              onClick={() => onChange([])}
            >
              Limpar
            </button>
          </div>
          <div className="flex max-h-72 flex-col gap-0.5 overflow-y-auto pr-1">
            {options.length === 0 && <p className="px-2 py-2 text-xs text-[var(--color-text-muted)]">Nenhuma opção disponível.</p>}
            {options.map((opt) => (
              <label
                key={opt}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-white/5"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggle(opt)}
                  className="size-3.5 accent-(--color-blue)"
                />
                <span className="text-[var(--color-text-secondary)]">{opt}</span>
              </label>
            ))}
          </div>
          {extraAction && (
            <button
              type="button"
              className="mt-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-[var(--color-text-secondary)] hover:bg-white/10"
              onClick={extraAction.onClick}
            >
              {extraAction.label}
            </button>
          )}
        </div>
      )}
    </Dropdown>
  );
}
