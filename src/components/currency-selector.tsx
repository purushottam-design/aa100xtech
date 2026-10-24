"use client";

import { Check, Globe, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { useCurrency } from "@/components/currency-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { currencies } from "@/data/currencies";
import { cn } from "@/lib/utils";

export function CurrencySelector({ className }: { className?: string }) {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return currencies;
    return currencies.filter((c) =>
      [c.code, c.symbol, c.name, c.country, c.countryCode].join(" ").toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("gap-2 px-3", className)}
          aria-label={`Display currency: ${currency.code}`}
        >
          <Globe className="size-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Currency</span>
          <span className="text-muted-foreground/60">·</span>
          <span className="text-sm font-semibold text-foreground">{currency.code}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[19rem] p-0">
        <div className="border-b border-border/60 p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search country or currency"
              className="h-9 pl-8"
            />
          </div>
        </div>
        <ul className="max-h-72 overflow-y-auto py-1" role="listbox">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              No currency found
            </li>
          ) : (
            results.map((c) => {
              const selected = c.code === currency.code;
              return (
                <li key={c.code + c.countryCode}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      setCurrency(c.code);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary",
                      selected && "bg-secondary",
                    )}
                  >
                    <span className="w-7 shrink-0 text-xs font-semibold text-muted-foreground">
                      {c.countryCode}
                    </span>
                    <span className="w-12 shrink-0 font-semibold text-foreground">{c.code}</span>
                    <span className="w-8 shrink-0 text-muted-foreground">{c.symbol}</span>
                    <span className="flex-1 truncate text-muted-foreground">{c.country}</span>
                    {selected ? <Check className="size-4 shrink-0 text-primary" /> : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
        <p className="border-t border-border/60 px-3 py-2 text-[11px] leading-snug text-muted-foreground">
          Display only — live indicative rates. Invoices and payments are billed in INR.
        </p>
      </PopoverContent>
    </Popover>
  );
}
