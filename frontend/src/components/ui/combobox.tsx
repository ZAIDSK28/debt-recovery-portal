import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
}

export const Combobox = memo(function Combobox({
  options,
  value,
  placeholder = "Select option",
  searchPlaceholder = "Search...",
  disabled = false,
  onChange,
}: {
  options: ComboboxOption[];
  value?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  const filtered = useMemo(() => {
    const lower = query.trim().toLowerCase();
    if (!lower) return options;
    return options.filter((option) => option.label.toLowerCase().includes(lower));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (disabled && open) {
      setOpen(false);
    }
  }, [disabled, open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800",
          "focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300 disabled:cursor-not-allowed disabled:bg-slate-50"
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={cn("truncate", selected ? "text-slate-800" : "text-slate-400")}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
      </button>

      {open ? (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_32px_rgba(15,23,42,0.12)]">
          <div className="border-b border-slate-100 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-200"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-auto p-1" role="listbox">
            {filtered.length > 0 ? (
              filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex min-h-8 w-full items-center justify-between rounded-xl px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-sky-50"
                >
                  <span className="truncate">{option.label}</span>
                  {option.value === value ? <Check className="h-4 w-4 shrink-0 text-sky-700" /> : null}
                </button>
              ))
            ) : (
              <div className="px-3 py-3 text-sm text-slate-500">No results found.</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
});