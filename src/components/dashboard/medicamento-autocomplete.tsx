"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
};

const DEBOUNCE_MS = 150;
const MIN_CHARS = 2;

function getCurrentToken(value: string, cursor: number): {
  token: string;
  start: number;
  end: number;
} {
  const before = value.slice(0, cursor);
  const sepIdx = Math.max(before.lastIndexOf(","), before.lastIndexOf(";"));
  const start = sepIdx === -1 ? 0 : sepIdx + 1;
  const afterStart = value.slice(start);
  const nextSepRel = afterStart.search(/[,;]/);
  const end = nextSepRel === -1 ? value.length : start + nextSepRel;
  const token = value.slice(start, end);
  return { token, start, end };
}

function applySuggestion(
  value: string,
  cursor: number,
  suggestion: string,
): { next: string; caret: number } {
  const { start, end, token } = getCurrentToken(value, cursor);
  const leading = token.match(/^\s*/)?.[0] ?? "";
  const replaced = `${leading}${suggestion} `;
  const next = value.slice(0, start) + replaced + value.slice(end);
  const caret = start + replaced.length;
  return { next, caret };
}

export function MedicamentoAutocomplete({
  value,
  onChange,
  placeholder,
  className,
  id,
}: Props) {
  const [items, setItems] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const cursorRef = useRef<number>(0);
  const reqIdRef = useRef(0);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const cursor = input.selectionStart ?? value.length;
    cursorRef.current = cursor;
    const { token } = getCurrentToken(value, cursor);
    const q = token.trim();
    if (q.length < MIN_CHARS) {
      setItems([]);
      setOpen(false);
      return;
    }
    const myId = ++reqIdRef.current;
    const handle = setTimeout(() => {
      void fetch(`/api/medicamentos/search?q=${encodeURIComponent(q)}`)
        .then((r) => (r.ok ? r.json() : { items: [] }))
        .then((data: { items?: string[] }) => {
          if (myId !== reqIdRef.current) return;
          const list = Array.isArray(data.items) ? data.items : [];
          setItems(list);
          setActive(0);
          setOpen(list.length > 0);
        })
        .catch(() => {
          if (myId !== reqIdRef.current) return;
          setItems([]);
          setOpen(false);
        });
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [value]);

  const pick = (suggestion: string) => {
    const cursor = inputRef.current?.selectionStart ?? value.length;
    const { next, caret } = applySuggestion(value, cursor, suggestion);
    onChange(next);
    setOpen(false);
    setItems([]);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + items.length) % items.length);
    } else if (e.key === "Tab" || e.key === "Enter") {
      e.preventDefault();
      pick(items[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <input
        id={id}
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onFocus={() => {
          if (items.length > 0) setOpen(true);
        }}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
      />
      {open && items.length > 0 ? (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-auto rounded-xl border border-[#e8e0d8] bg-white py-1 shadow-lg"
        >
          {items.map((item, i) => (
            <li
              key={item}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(item);
              }}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-3.5 py-2 text-sm ${
                i === active
                  ? "bg-[#f0faf5] text-[#1a1a1a]"
                  : "text-[#333] hover:bg-[#faf9f7]"
              }`}
            >
              {item}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
