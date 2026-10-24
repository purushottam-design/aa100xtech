"use client";

import { useSearchParams } from "next/navigation";


import { AdminNav } from "@/components/admin-nav";
import { SuperAdminConsole } from "@/components/super-admin-console";

export default SuperAdminPage;

function SuperAdminPage() {
  const section = useSearchParams().get("section") ?? undefined;
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        Super admin console
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Full control of every module: users, admins, permissions, business records and security.
      </p>
      <AdminNav className="mt-6" />
      <div className="mt-8">
        <SuperAdminConsole initialSection={section} />
      </div>
    </div>
  );
}
