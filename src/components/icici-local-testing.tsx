"use client";

import { useRef, useState } from "react";
import type { z } from "zod";
import type { consultationBookingSchema } from "@/lib/consultations.schemas";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/** Simulation has no payment API, booking mutation, or path to the paid screen. */
export function IciciLocalTesting({
  booking,
  amount,
  validate,
  canTransition,
  transitionReason,
  signedIn,
  disabled,
}: {
  booking: z.infer<typeof consultationBookingSchema>;
  amount: number;
  validate: () => boolean;
  canTransition: boolean;
  transitionReason?: string | undefined;
  signedIn: boolean;
  disabled: boolean;
}) {
  const [simulated, setSimulated] = useState<"success" | "failure" | "pending" | null>(null);
  const [transferring, setTransferring] = useState(false);
  const transferInFlight = useRef(false);
  const beginTransition = async () => {
    if (transferInFlight.current || !validate()) return;
    transferInFlight.current = true;
    setTransferring(true);
    try {
      const headers = await attachSupabaseAuth();
      headers.set("x-aa-rpc", "1");
      headers.set("content-type", "application/json");
      const response = await fetch("/api/payments/icici/transition", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers,
        body: JSON.stringify(booking),
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json();
      if (!response.ok || !result.ok)
        throw new Error(result.message ?? "The secure UAT transition could not be started.");
      const destination = new URL(result.destination);
      if (
        destination.protocol !== "https:" ||
        !/^[a-z0-9-]+\.ngrok-free\.dev$/.test(destination.hostname) ||
        destination.port ||
        destination.username ||
        destination.password ||
        destination.search ||
        destination.hash ||
        destination.pathname !== "/api/payments/icici/handoff" ||
        !/^[a-f0-9]{64}$/.test(result.ticket)
      )
        throw new Error("The UAT destination could not be verified.");
      const policy = document.createElement("meta");
      policy.name = "referrer";
      policy.content = "no-referrer";
      document.head.append(policy);
      const form = document.createElement("form");
      form.method = "POST";
      form.action = destination.href;
      form.hidden = true;
      const input = document.createElement("input");
      input.name = "ticket";
      input.value = result.ticket;
      form.append(input);
      document.body.append(form);
      form.submit();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "The UAT transition could not be started.",
      );
      setTransferring(false);
      transferInFlight.current = false;
    }
  };
  return (
    <section
      aria-label="Local ICICI development"
      className="mt-6 rounded-xl border border-dashed border-primary/40 bg-surface-2/50 p-4"
    >
      <h3 className="font-semibold">ICICI development testing</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Simulation runs only in this browser. It takes no payment and creates no booking.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={disabled || transferring}
          onClick={() => {
            if (validate()) setSimulated("pending");
          }}
        >
          Simulate ICICI locally
        </Button>
        <Button
          variant="outline"
          disabled={disabled || transferring || !canTransition || !signedIn}
          onClick={beginTransition}
        >
          {transferring ? "Opening HTTPS UAT…" : "Continue to HTTPS ICICI UAT"}
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Real ICICI UAT requires your Super Admin authorization and continues on the configured HTTPS
        tunnel.
      </p>
      {!signedIn && (
        <p className="mt-2 text-xs">
          Sign in as a Super Administrator on localhost to authorize UAT.
        </p>
      )}
      {!canTransition && (
        <p className="mt-2 text-xs">
          {transitionReason ?? "The HTTPS UAT transition is not configured."}
        </p>
      )}
      {simulated && (
        <div
          className="mt-4 rounded-lg border border-border p-4"
          role="region"
          aria-label="ICICI simulation"
        >
          <p className="font-semibold">
            SIMULATED ICICI —{" "}
            {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount)}
          </p>
          <p role="status" className="mt-2">
            Simulated {simulated}. No real payment or booking status was changed.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["success", "failure", "pending"] as const).map((outcome) => (
              <Button key={outcome} variant="outline" onClick={() => setSimulated(outcome)}>
                Simulate {outcome}
              </Button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
