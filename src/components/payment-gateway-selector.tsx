"use client";
import { ShieldCheck } from "lucide-react";
import { paymentGateways, type PaymentGateway } from "@/lib/payment-gateways";

export function PaymentGatewaySelector({
  selected,
  onChange,
  amount,
  disabled = false,
  iciciAvailable = false,
}: {
  selected: PaymentGateway;
  onChange: (gateway: PaymentGateway) => void;
  amount: number;
  disabled?: boolean;
  iciciAvailable?: boolean;
}) {
  const payable = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount / 100);
  return (
    <fieldset disabled={disabled} className="mt-6">
      <legend className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Choose Your Payment Method
      </legend>
      <div className="mt-3 grid gap-3">
        {paymentGateways.map((metadata) => {
          const gateway = {
            ...metadata,
            available: metadata.id === "icici" ? iciciAvailable : metadata.available,
          };
          return (
            <label
              key={gateway.id}
              className={`flex items-start gap-3 rounded-xl border p-4 ${!gateway.available ? "cursor-not-allowed border-border/60 bg-surface-2/30 text-muted-foreground" : selected === gateway.id ? "cursor-pointer border-primary/40 bg-surface-2/60" : "cursor-pointer border-border bg-surface-2/30"}`}
            >
              <input
                type="radio"
                name="paymentGateway"
                value={gateway.id}
                checked={selected === gateway.id}
                disabled={!gateway.available}
                onChange={() => {
                  if (gateway.available) onChange(gateway.id);
                }}
                aria-describedby={`${gateway.id}-payment-description`}
                className="mt-1 accent-orange-400"
              />
              <ShieldCheck
                className={`mt-0.5 size-5 shrink-0 ${gateway.available ? "text-primary" : "text-muted-foreground"}`}
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">Pay with {gateway.name}</span>
                  <span className="text-sm">{payable}</span>
                </span>
                <span id={`${gateway.id}-payment-description`} className="mt-1 block text-xs">
                  {gateway.description}
                  {!gateway.available && (
                    <span className="mt-1 block font-medium">Currently unavailable</span>
                  )}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
