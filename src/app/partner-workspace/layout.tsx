import type { Metadata } from "next";
import type { ReactNode } from "react";
import { WorkspaceShell } from "@/components/partner-workspace/workspace-shell";
import "./workspace.css";
export const metadata: Metadata = {
  title: "Partner Workspace | AA100XTech",
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: ReactNode }) {
  return <WorkspaceShell>{children}</WorkspaceShell>;
}
