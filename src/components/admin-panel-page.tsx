import { useQuery } from "@tanstack/react-query";

import { AdminPanelShell, DataTable, StatGrid } from "@/components/admin-panel-shell";
import { type AdminPanel } from "@/lib/admin-panels";
import { getPanelDashboard } from "@/lib/admin-panels.functions";

/**
 * Renders one role dashboard from real database data. Every fetch is
 * authorized again on the server for the caller's roles.
 */
export function AdminPanelPage({
  panel,
  description,
}: {
  panel: AdminPanel;
  description: string;
}) {
  const data = useQuery({
    queryKey: ["admin-panel", panel],
    queryFn: () => getPanelDashboard({ data: { panel } }),
    retry: false,
    throwOnError: false,
  });

  return (
    <AdminPanelShell panel={panel} description={description}>
      {data.isLoading ? (
        <p className="text-muted-foreground">Loading dashboard…</p>
      ) : data.isError || (data.data as any)?.denied ? (
        <p className="text-muted-foreground">
          You do not have permission to perform this action.
        </p>
      ) : (
        <>
          <StatGrid stats={data.data?.stats ?? []} />
          {(data.data?.tables ?? []).map((t: any) => (
            <DataTable key={t.title} title={t.title} columns={t.columns} rows={t.rows} />
          ))}
        </>
      )}
    </AdminPanelShell>
  );
}
