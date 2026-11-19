"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Inbox, RotateCw } from "lucide-react";
import { workspaceApi } from "@/lib/partner-workspace/api";
import { base, type WorkspaceRow } from "@/lib/partner-workspace/domain";

export function useWorkspaceData<T>(operation: string, input: unknown) {
  const [data, setData] = useState<T | null>(null),
    [error, setError] = useState<string | null>(null),
    [version, setVersion] = useState(0);
  const payload = JSON.stringify(input);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setData(null);
    setError(null);
    workspaceApi<T>(operation, JSON.parse(payload), controller.signal)
      .then((value) => {
        if (active) setData(value);
      })
      .catch((failure) => {
        if (active)
          setError(failure instanceof Error ? failure.message : "Unable to load records.");
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [operation, payload, version]);
  return { data, error, refresh: () => setVersion((v) => v + 1) };
}
export function LoadError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="pw-error" role="alert">
      <span>{message}</span>
      <button className="pw-button pw-button-outline" onClick={retry}>
        <RotateCw size={16} /> Retry
      </button>
    </div>
  );
}
export function Skeleton() {
  return (
    <div className="pw-skeleton" role="status" aria-label="Loading workspace data">
      <div />
      <div />
      <div />
    </div>
  );
}
export function Empty({
  title = "No records yet",
  children,
}: {
  title?: string;
  children?: ReactNode;
}) {
  return (
    <div className="pw-empty">
      <Inbox size={28} />
      <strong>{title}</strong>
      <p>{children ?? "New records will appear here once they are saved in your workspace."}</p>
    </div>
  );
}
export function Badge({ value }: { value: unknown }) {
  const label = String(value ?? "new");
  return (
    <span className={`pw-badge pw-badge-${label.replaceAll("_", "-")}`}>
      {label.replaceAll("_", " ")}
    </span>
  );
}
export function rowName(value: unknown): string {
  return value && typeof value === "object" && "name" in value
    ? String(value.name)
    : "Unlinked record";
}
export function localDate(value: unknown, withTime = false) {
  if (!value) return "—";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(withTime ? ({ hour: "numeric", minute: "2-digit" } as const) : {}),
  }).format(date);
}
export function money(value: unknown, currency: unknown = "INR") {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: String(currency),
      maximumFractionDigits: 0,
    }).format(Number(value ?? 0));
  } catch {
    return String(value ?? "—");
  }
}
export function SectionHeader({
  title,
  href,
  count,
}: {
  title: string;
  href: string;
  count?: number;
}) {
  return (
    <div className="pw-card-heading">
      <h2>
        {title} {count !== undefined && <em>({count})</em>}
      </h2>
      <Link href={href}>
        View all <ArrowRight size={15} />
      </Link>
    </div>
  );
}
export function ApprovalTable({ rows }: { rows: WorkspaceRow[] }) {
  return rows.length ? (
    <div className="pw-table-scroll">
      <table className="pw-table">
        <thead>
          <tr>
            <th>Creator / Influencer</th>
            <th>Brand / Campaign</th>
            <th>Deal Value</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const terms = (row["snapshot"] as WorkspaceRow) ?? {};
            const name = rowName(row["influencer"]);
            return (
              <tr key={String(row["id"])}>
                <td>
                  <div className="pw-person">
                    <span className="pw-initials">
                      {name
                        .split(" ")
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join("")}
                    </span>
                    <div>
                      <strong>{name}</strong>
                      <small>Revision {String(row["revision"])}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <strong>{String(terms["brand"] || "Not specified")}</strong>
                  <small>{String(terms["collaboration"] || "Deal")}</small>
                </td>
                <td>
                  <strong>{money(terms["amount"], terms["currency"])}</strong>
                </td>
                <td>
                  <Badge value={row["status"]} />
                </td>
                <td>
                  <Link
                    className="pw-button pw-button-outline pw-button-small"
                    href={`${base}/deal-approvals/${row["id"]}`}
                  >
                    View
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty title="All caught up">Deals submitted for review will appear here.</Empty>
  );
}
