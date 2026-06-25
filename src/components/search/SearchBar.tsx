"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { Suggestion } from "@/lib/search";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  /** When provided, an autocomplete dropdown appears as the user types. */
  fetchSuggestions?: (q: string) => Promise<Suggestion[]>;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
};

/**
 * Debounced, keyboard-navigable search input with an optional suggestions
 * dropdown. Reused for both job and candidate search.
 */
export default function SearchBar({
  value,
  onChange,
  onSubmit,
  fetchSuggestions,
  placeholder = "Search…",
  autoFocus,
  className,
}: SearchBarProps) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const debounced = useDebouncedValue(value, 250);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!fetchSuggestions) return;
    const q = debounced.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchSuggestions(q)
      .then((list) => {
        if (cancelled) return;
        setSuggestions(list);
        setOpen(true);
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, fetchSuggestions]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
    setActive(-1);
    onSubmit?.(next);
  };

  return (
    <div ref={boxRef} className={cn("relative", className)}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={18}
        />
        <input
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setActive(-1);
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              choose(active >= 0 && suggestions[active] ? suggestions[active].value : value);
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((a) => Math.min(a + 1, suggestions.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-12 w-full rounded-2xl border border-border bg-background pl-12 pr-11 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
        />
        {loading ? (
          <Loader2
            className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground"
            size={16}
          />
        ) : value ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              onChange("");
              setSuggestions([]);
              setOpen(false);
              onSubmit?.("");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:bg-muted"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-border bg-popover p-1.5 shadow-xl">
          {suggestions.map((s, i) => (
            <li key={`${s.value}-${i}`}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(s.value)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition",
                  i === active ? "bg-muted" : "hover:bg-muted/60",
                )}
              >
                <Search size={14} className="shrink-0 text-muted-foreground" />
                <span className="truncate">{s.value}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
