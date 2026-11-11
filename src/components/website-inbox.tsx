"use client";
import { useEffect, useState } from "react";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { enquiryStatuses, socialAdProposalSchema } from "@/lib/social-ad-proposal";

function AdvertisingDetails({ value }: { value: string }) {
  try {
    const result = socialAdProposalSchema.safeParse(JSON.parse(value));
    if (!result.success) return <p>Advertising details could not be read.</p>;
    const details = result.data;
    return (
      <dl className="mt-5 grid gap-3 rounded-lg border p-4 text-sm sm:grid-cols-2">
        {[
          ["Services", details.services.join(", ")],
          ["Platforms", details.platforms.join(", ")],
          ["Monthly ad spend", details.budget],
          ["Target location", details.location],
          ["Objective", details.objective],
          ["Campaign start", details.startDate],
          ["Company website", details.companyWebsite || "Not provided"],
          ["Privacy consent", "Accepted"],
        ].map(([label, text]) => (
          <div key={label}>
            <dt className="font-semibold">{label}</dt>
            <dd className="mt-1 break-words text-muted-foreground">{text}</dd>
          </div>
        ))}
      </dl>
    );
  } catch {
    return <p>Advertising details could not be read.</p>;
  }
}
type Entry = {
  id: string;
  kind: string;
  created_at: string;
  recipient: string;
  notification_status: string;
  payload: Record<string, string>;
};
export function WebsiteInbox() {
  const [rows, setRows] = useState<Entry[]>([]);
  const [message, setMessage] = useState("Loading requests…");
  const [canEditLeads, setCanEditLeads] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  async function updateStatus(id: string, status: string) {
    setSaving(id);
    try {
      const response = await fetch("/api/website/requests", {
        method: "PATCH",
        headers: {
          ...(await attachSupabaseAuth()),
          "content-type": "application/json",
          "x-aa-rpc": "1",
        },
        body: JSON.stringify({ id, status }),
      });
      const result = await response.json();
      if (!response.ok || !result.saved)
        throw new Error(result.message || "Status could not be saved.");
      setRows((current) =>
        current.map((row) =>
          row.id === id ? { ...row, payload: { ...row.payload, status } } : row,
        ),
      );
      setMessage("Enquiry status updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Status could not be saved.");
    } finally {
      setSaving(null);
    }
  }
  async function attachment(id: string) {
    try {
      const response = await fetch(`/api/website/requests?attachment=${encodeURIComponent(id)}`, {
        headers: await attachSupabaseAuth(),
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch {
      setMessage("The attachment could not be opened. Please try again.");
    }
  }
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/website/requests", {
          headers: await attachSupabaseAuth(),
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        if (active) {
          setRows(result.rows);
          setCanEditLeads(result.canEditLeads === true);
          setMessage(result.rows.length ? "" : "No requests yet.");
        }
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : "Requests unavailable.");
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  return (
    <div className="space-y-5">
      {message && <p role="status">{message}</p>}
      {rows.map((row) => (
        <article key={row.id} className="surface-card p-6">
          <p className="text-xs uppercase text-primary">
            {row.kind} · {new Date(row.created_at).toLocaleDateString()}
          </p>
          <h2 className="mt-3 text-xl font-semibold">{row.payload["name"]}</h2>
          <p className="mt-2 break-words text-sm">
            {row.payload["email"]} · {row.payload["phone"]}
          </p>
          <p className="mt-2 text-sm">
            {row.payload["company"]} · {row.payload["selectedPlan"] || row.payload["role"]}
          </p>
          <p className="mt-4 whitespace-pre-wrap text-sm">{row.payload["requirements"]}</p>
          <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
            {row.payload["message"]}
          </p>
          {row.payload["socialAds"] && (
            <>
              <AdvertisingDetails value={row.payload["socialAds"]} />
              <label className="mt-4 flex flex-wrap items-center gap-3 text-sm font-medium">
                Enquiry status
                <select
                  aria-label={`Enquiry status for ${row.payload["name"]}`}
                  className="rounded-md border bg-background p-2"
                  value={row.payload["status"] || "New"}
                  disabled={!canEditLeads || saving !== null}
                  onChange={(event) => void updateStatus(row.id, event.target.value)}
                >
                  {enquiryStatuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
                {saving === row.id && <span role="status">Saving…</span>}
              </label>
            </>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Notification: {row.notification_status} · {row.recipient}
          </p>
          {row.payload["filePath"] && (
            <button
              type="button"
              className="mt-3 text-sm text-primary underline"
              onClick={() => void attachment(row.id)}
            >
              Download PDF attachment
            </button>
          )}
        </article>
      ))}
    </div>
  );
}
