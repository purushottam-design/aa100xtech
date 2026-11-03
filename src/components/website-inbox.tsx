"use client";
import { useEffect, useState } from "react";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
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
