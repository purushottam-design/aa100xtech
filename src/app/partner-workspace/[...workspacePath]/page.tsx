import { notFound } from "next/navigation";
import { moduleTitles } from "@/lib/partner-workspace/domain";
import { WorkspacePage } from "@/components/partner-workspace/workspace-page";
export default async function Page({ params }: { params: Promise<{ workspacePath: string[] }> }) {
  const { workspacePath } = await params;
  const module = workspacePath[0]!;
  if (
    !Object.hasOwn(moduleTitles, module) ||
    workspacePath.length > 2 ||
    (workspacePath.length === 2 &&
      !["creators", "influencers", "leads", "deal-approvals"].includes(module)) ||
    (workspacePath[1] && !/^[0-9a-f-]{36}$/i.test(workspacePath[1]))
  )
    notFound();
  return <WorkspacePage module={module} recordId={workspacePath[1] ?? null} />;
}
